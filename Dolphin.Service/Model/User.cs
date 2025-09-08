using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class User
{
      [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? userId { get; set; } = null;

      [BsonElement("UserName")]

    public string UserName { get; set;}
          [BsonElement("Email")]

    public string Email { get; set; }   
     [BsonElement("Role")]

    public string Role { get; set; }
    
     [BsonElement("PhoneNumber")]  
     public string? PhoneNumber { get; set;}

     [BsonElement("password")]  
      public string PasswordHash { get; set; }

}

public class LoginRequest
{
    public string Email { get; set; }
    public string Password { get; set; }
}
