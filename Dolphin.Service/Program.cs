using Dolphin.Services.Helper;
using Dolphin.Services.Models;
using Finance.Service.Repository;
using Finance.Service.Settings;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers(); // This is essential for your API controllers
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
ServiceSettings serviceSettings = new ServiceSettings();
serviceSettings = builder.Configuration.GetSection(nameof(ServiceSettings)).Get<ServiceSettings>();
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("SmtpSettings"));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });
builder.Services.AddTransient<IEmailService, EmailService>();

builder.Services.AddScoped<JwtTokenGenerator>();

builder.Services.AddMongo();
builder.Services.AddMongoRepository<GraniteStockBlock>();
builder.Services.AddMongoRepository<Invoice>();
builder.Services.AddMongoRepository<Client>();
builder.Services.AddMongoRepository<User>();
builder.Services.AddMongoRepository<GpType>();
// Register in Program.cs or Startup.cs
builder.Services.AddScoped<MetricCalculation>();


builder.Services.AddTransient<MyService>();
builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAngularApp",
                builder => builder
                    .WithOrigins("http://localhost:4200", "http://localhost", "http://192.168.0.145", "http://192.168.212.247") // Your Angular app's URL
                    .AllowAnyMethod()
                    .AllowAnyHeader());
        });
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

}
app.UseCors("AllowAngularApp");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers(); // Map the controller routes

app.Run();
