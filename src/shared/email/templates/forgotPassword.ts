export const forgotPasswordTemplate = (resetUrl: string) => `
<h2>Reset Password</h2>

<p>Click below to reset your password.</p>

<a href="${resetUrl}">
  Reset Password
</a>
`;
