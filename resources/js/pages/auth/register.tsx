// @ts-nocheck
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules?: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Form {...store.form()}>
                {({ processing, errors }) => (
                    <div className="grid gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="username" className="text-xs">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                name="username"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="username"
                                placeholder="your_username"
                                className="h-8 text-sm"
                            />
                            <InputError message={errors.username} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="text-xs">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                placeholder="email@example.com"
                                className="h-8 text-sm"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password" className="text-xs">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                placeholder="Min. 8 characters"
                                className="h-8 text-sm"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password_confirmation" className="text-xs">Confirm password</Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                placeholder="Re-enter your password"
                                className="h-8 text-sm"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button
                            type="submit"
                            className="mt-1 w-full h-8 text-sm"
                            tabIndex={5}
                            disabled={processing}
                            data-test="register-button"
                        >
                            {processing && <Spinner />}
                            Create account
                        </Button>
                    </div>
                )}
            </Form>

            <p className="text-center text-xs text-muted-foreground mt-3">
                Already have an account?{' '}
                <TextLink href={login()} tabIndex={6}>
                    Log in
                </TextLink>
            </p>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to get started',
};
