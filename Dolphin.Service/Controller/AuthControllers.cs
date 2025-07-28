using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("dolphin/[controller]")]
public class AuthController : ControllerBase
{

    private readonly JwtTokenGenerator _jwtTokenGenerator;
    private readonly MyService _myService;
    private readonly IEmailService _emailService;
  
    public AuthController(JwtTokenGenerator jwtTokenGenerator, MyService myService,IEmailService emailService)
    {
        _myService = myService;
        _jwtTokenGenerator = jwtTokenGenerator;
          _emailService = emailService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] User userdata)
    {

     var userid=  await _myService.AddUser("UserCollections", userdata);
     if(userid=="UserExist")
     {
          return Conflict("A user with this email already exists.");
     }
        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
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
        return Ok(new { Token = token });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        return Ok();
    }

 [HttpGet("getalluser")]
public async Task<IActionResult> GetAllUser()
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

[HttpGet("profile")]
public async Task<IActionResult> Profile(string email)
{
    // Validate input
    if (string.IsNullOrWhiteSpace(email))
    {
        return BadRequest("Email is required.");
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

[HttpGet("passwordrequest")]
public async Task<ActionResult> SendPasswordEmail(string email)
{
       var userProfile = await _myService.GetUserProfile("UserCollections", email);
       if(userProfile==null)
       {
        return BadRequest();

       }
var loginPassword =await _myService.UpadatePassword("UserCollections",userProfile);
await _emailService.SendPasswordEmailAsync(loginPassword,userProfile);
return Ok();
}

}
