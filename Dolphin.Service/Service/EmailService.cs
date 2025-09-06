using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

public interface IEmailService
{

    Task SendPasswordEmailAsync(string pwd, User profile);

}


public class EmailService : IEmailService
{
    private readonly SmtpSettings _smtpSettings;

    public EmailService(IOptions<SmtpSettings> smtpSettings)
    {
        _smtpSettings = smtpSettings.Value;
    }


    public async Task SendPasswordEmailAsync(string pwd, User profile)
    {

        string emailBody = EmailTemplates.PasswordNotificationTemplate
        .Replace("{{RecipientName}}", profile.UserName)
        .Replace("{{Password}}", pwd);


        using var client = new SmtpClient(_smtpSettings.Server, _smtpSettings.Port)
        {
            Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password),
            EnableSsl = _smtpSettings.EnableSsl
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(_smtpSettings.SenderEmail, _smtpSettings.SenderName),
            Subject = "Your Password to login Release Readiness Review",
            Body = emailBody,
            IsBodyHtml = true
        };

        mailMessage.To.Add(profile.Email);

        await client.SendMailAsync(mailMessage);

    }

}
