public static class EmailTemplates
{
    public static string DefaultTemplate = @"
    <html>
      <body>
        <h1>Welcome to Our Service!</h1>
        <p>Dear {{RecipientName}},</p>
        <p>Thank you for joining us. We are excited to have you on board!</p>
        <p>Regards,<br>Your Company</p>
      </body>
    </html>";

    public static string ReleaseReadinessTemplate = @"
    <html>
      <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
        <h2>Release Readiness Review</h2>
        <p>Dear Admin,</p>
        <p>
          I am submitting the <strong>{{ProjectReleaseName}}</strong> for the Release Readiness Review 
          ahead of our planned deployment on <strong>{{ReleaseDate}}</strong>. Please find the relevant 
          details and documentation attached for your review.
        </p>
        <p>
          Kindly review the release based on the readiness criteria and let us know if any concerns arise before we proceed.
        </p>
  <p>
          You can review the release details and provide feedback at the following link:  
          <a href='http://192.168.0.171:8080/login' style='color: #007bff; text-decoration: none;'>Review Release</a>
        </p>
        <p>
          Best regards,<br>
          {{YourName}}<br>
       
        </p>
      </body>
    </html>";

    public static string ReleaseNotReadyTemplate = @"
    <html>
      <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
        <h2>Release Readiness Review Feedback</h2>
        <p>Dear {{RecipientName}},</p>
        <p>
          Thank you for submitting the <strong>{{ProjectReleaseName}}</strong> for the Release Readiness Review. After careful evaluation, we regret to inform you that the release is not yet ready for deployment.
        </p>
        <p>
          The following areas require attention before we can proceed:
        </p>
        <ul>
          {{IssuesList}}
        </ul>
        <p>
          We kindly request that these issues be addressed and the release resubmitted for review at your earliest convenience. Please let us know if you need any further clarification or assistance.
        </p>
        <p>
          We appreciate your efforts and look forward to a successful release once the necessary adjustments have been made.
        </p>
        <p>
          Best regards,<br>
          Admin<br>
     
        </p>
      </body>
    </html>";

     public static string ReleaseApprovedTemplate = @"
    <html>
      <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
        <h2>Release Readiness Review Approval</h2>
        <p>Dear {{RecipientName}},</p>
        <p>
          Thank you for submitting the <strong>{{ProjectReleaseName}}</strong> for the Release Readiness Review. After careful evaluation, I am pleased to inform you that the release has been approved for deployment.
        </p>
        <p>
          Everything appears to be in order, and all necessary criteria have been met. We are now ready to proceed with the planned release on <strong>{{ReleaseDate}}</strong>.
        </p>
        <p>
          If there are any last-minute changes or updates, please inform us as soon as possible.
        </p>
        <p>
          Thank you for your hard work and thorough preparation. I look forward to the successful deployment of this release.
        </p>
        <p>
          Best regards,<br>
            Admin<br>
      
        </p>
      </body>
    </html>";

    public static string PasswordNotificationTemplate = @"
<html>
  <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
    <h2>Your Account Password</h2>
    <p>Dear {{RecipientName}},</p>
    <p>
      Welcome to Release Readiness Review!. Below is your login password:
    </p>
    <p style='font-size: 18px; font-weight: bold; color: #2a9df4;'>{{Password}}</p>
    <p>
      Please use this password to log in to your account. For security purposes, we recommend that you change your password after logged in.
    </p>
    <p>
      If you did not request this account or believe this email was sent to you in error, please contact our support team immediately.
    </p>
    <p>
      Best regards,<br>
      Release Readiness Review<br>
   
    </p>
  </body>
</html>";
}
