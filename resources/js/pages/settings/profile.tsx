import { Form, Head, usePage, router } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Camera, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { useInitials } from '@/hooks/use-initials';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const getInitials = useInitials();

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            await api.post('/settings/profile/avatar', formData);
            toast.success('Profile photo updated');
            router.reload({ only: ['auth'] });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-16 w-16 overflow-hidden rounded-full">
                            <AvatarImage src={auth.user.avatar} alt={auth.user.username} />
                            <AvatarFallback className="rounded-full bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white text-lg">
                                {getInitials(auth.user.username)}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_12px_rgb(0,255,102,0.3)] transition-all"
                        >
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[var(--color-on-surface)]">{auth.user.username}</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)]">Click the camera icon to change photo</p>
                    </div>
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>

                                <Input
                                    id="username"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.username}
                                    name="username"
                                    required
                                    autoComplete="username"
                                    placeholder="Username"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.username}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
