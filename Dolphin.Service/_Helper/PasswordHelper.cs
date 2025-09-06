public class PasswordHelper
{
    public static string HashPassword(string password)
    {
        // Add work factor parameter for consistent hashing
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
    }

    public static bool VerifyPassword(string password, string hashedPassword)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hashedPassword))
            return false;
            
        return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
    }
}
