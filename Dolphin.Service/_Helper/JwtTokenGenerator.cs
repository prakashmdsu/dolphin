using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

public class JwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
        var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured");
        var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured");
        
        // Ensure key is at least 32 bytes (256 bits)
        if (Encoding.UTF8.GetBytes(key).Length < 32)
        {
            throw new InvalidOperationException("JWT Key must be at least 32 characters long");
        }

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        // Use UTC time consistently
        var now = DateTime.UtcNow;
        var expiry = now.AddMinutes(Convert.ToInt32(_configuration["Jwt:ExpirationMinutes"] ?? "30"));
        
        Console.WriteLine($"Token created at UTC: {now}");
        Console.WriteLine($"Token expires at UTC: {expiry}");

        var claims = new List<Claim>
        {
            // Standard JWT claims
            new Claim(JwtRegisteredClaimNames.Sub, user.Email),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString()),
            
            // Custom claims
            new Claim("role", user.Role)
        };

        // Add optional claims if properties exist
        if (!string.IsNullOrEmpty(user.userId?.ToString()))
        {
            claims.Add(new Claim("userId", user.userId.ToString()));
        }

        // Add name claim
        var nameValue = user.GetType().GetProperty("Name")?.GetValue(user)?.ToString() ?? user.Email;
        claims.Add(new Claim("name", nameValue));

        var token = new JwtSecurityToken(
            issuer: issuer,    // Use configuration value, not hardcoded
            audience: audience, // Use configuration value, not hardcoded
            claims: claims,
            notBefore: now,
            expires: expiry,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[32];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
            var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured");
            var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured");

            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }
}