using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly JwtTokenGenerator _jwtTokenGenerator;
    private readonly MyService _myService;
    private readonly IEmailService _emailService;

    public AuthController(JwtTokenGenerator jwtTokenGenerator, MyService myService, IEmailService emailService)
    {
        _myService = myService;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailService = emailService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] User userdata)
    {
        // Validate input
        if (userdata == null || string.IsNullOrWhiteSpace(userdata.Email))
        {
            return BadRequest("Invalid user data.");
        }

        var userid = await _myService.AddUser("UserCollections", userdata);
        if (userid == "UserExist")
        {
            return Conflict("A user with this email already exists.");
        }
        
        return Ok(new { Message = "User registered successfully", UserId = userid });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Validate input
        if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var user = await _myService.GetLoginUser("UserCollections", request);

        if (user == null)
        {
            return Unauthorized("Invalid credentials.");
        }

        bool isPasswordValid = PasswordHelper.VerifyPassword(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return Unauthorized("Invalid credentials.");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);
        
        // Return user info along with token (excluding sensitive data)
        return Ok(new { 
            Token = token,
            User = new {
                user.Email,
                user.Role,
                UserName = user.UserName
            }
        });
    }

    [HttpPost("logout")]
    [Authorize] // Require authentication for logout
    public async Task<IActionResult> Logout()
    {
        // In a stateless JWT system, logout is typically handled client-side
        // You could implement token blacklisting here if needed
        return Ok(new { Message = "Logged out successfully" });
    }

    [HttpGet("getalluser")]
    [Authorize(Roles = "Admin")] // Only admins should see all users
    public async Task<IActionResult> GetAllUser()
    {
        try
        {
            // Fetch all users
            var allUsers = await _myService.GetAllUser("UserCollections");

            // Check if users exist
            if (allUsers == null || !allUsers.Any())
            {
                return NotFound("No users found.");
            }

            // Map all users to ProfileDto
            var profileDtos = allUsers.Select(user => new ProfileDto(
                user.userId,
                user.UserName,
                user.Email,
                user.Role,
                user.PhoneNumber
            )).ToList();

            // Return the list of ProfileDto
            return Ok(profileDtos);
        }
        catch (Exception ex)
        {
            // Log the exception
            return StatusCode(500, "An error occurred while fetching users.");
        }
    }

    [HttpGet("profile")]
    [Authorize] // Require authentication
    public async Task<IActionResult> Profile(string? email = null)
    {
        try
        {
            // If no email provided, use the current user's email from token
            if (string.IsNullOrWhiteSpace(email))
            {
                email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest("Unable to determine user email.");
                }
            }
            else
            {
                // If email is provided, ensure the user can only access their own profile
                // unless they are an admin
                var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
                var userRole = User.FindFirst("role")?.Value;
                
                if (email != currentUserEmail && userRole != "Admin")
                {
                    return Forbid("You can only access your own profile.");
                }
            }

            // Fetch user profile
            var userProfile = await _myService.GetUserProfile("UserCollections", email);

            // Check if the user profile exists
            if (userProfile == null)
            {
                return NotFound("User profile not found.");
            }

            // Map to DTO
            var profileDto = new ProfileDto(
                userProfile.userId,
                userProfile.UserName,
                userProfile.Email,
                userProfile.Role,
                userProfile.PhoneNumber
            );

            // Return the DTO as the response
            return Ok(profileDto);
        }
        catch (Exception ex)
        {
            // Log the exception
            return StatusCode(500, "An error occurred while fetching the profile.");
        }
    }

    [HttpGet("me")]
    [Authorize] // Get current user's profile
    public async Task<IActionResult> GetCurrentUserProfile()
    {
        try
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Unable to determine user email from token.");
            }

            var userProfile = await _myService.GetUserProfile("UserCollections", email);
            if (userProfile == null)
            {
                return NotFound("User profile not found.");
            }

            var profileDto = new ProfileDto(
                userProfile.userId,
                userProfile.UserName,
                userProfile.Email,
                userProfile.Role,
                userProfile.PhoneNumber
            );

            return Ok(profileDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, "An error occurred while fetching the profile.");
        }
    }

    [HttpPost("passwordrequest")]
    [AllowAnonymous] // Allow anonymous access for password reset
    public async Task<ActionResult> SendPasswordEmail([FromBody] PasswordResetRequest request)
    {
        try
        {
            // Validate input
            if (request == null || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest("Email is required.");
            }

            var userProfile = await _myService.GetUserProfile("UserCollections", request.Email);
            if (userProfile == null)
            {
                // Don't reveal whether the user exists or not for security
                return Ok(new { Message = "If the email exists, a password reset link has been sent." });
            }

            var loginPassword = await _myService.UpadatePassword("UserCollections", userProfile);
            await _emailService.SendPasswordEmailAsync(loginPassword, userProfile);
            
            return Ok(new { Message = "If the email exists, a password reset link has been sent." });
        }
        catch (Exception ex)
        {
            // Log the exception
            return StatusCode(500, "An error occurred while processing the password reset request.");
        }
    }

    [HttpPut("profile")]
    [Authorize] // Allow users to update their own profile
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Unable to determine user email from token.");
            }

            // Validate input
            if (request == null)
            {
                return BadRequest("Invalid request data.");
            }

            // Update user profile logic here
            // var updatedUser = await _myService.UpdateUserProfile("UserCollections", email, request);
            
            return Ok(new { Message = "Profile updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, "An error occurred while updating the profile.");
        }
    }
}

// Additional DTOs you might need
public class PasswordResetRequest
{
    public string Email { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    public string UserName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    // Add other fields that can be updated
}