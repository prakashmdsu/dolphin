using Dolphin.Services.Helper;
using Dolphin.Services.Models;
using Finance.Service.Repository;
using Finance.Service.Settings;


var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers(); // This is essential for your API controllers
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
ServiceSettings serviceSettings = new ServiceSettings();
serviceSettings = builder.Configuration.GetSection(nameof(ServiceSettings)).Get<ServiceSettings>();
// builder.Services.AddMongo().AddMongoRepository<Stocks>("stocks");
// builder.Services.AddMongo().AddMongoRepository<AnalysedCollection>("AnalysedCollection");

builder.Services.AddMongo();
builder.Services.AddMongoRepository<GraniteStockBlock>();
builder.Services.AddMongoRepository<Invoice>();
builder.Services.AddMongoRepository<Client>();
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
