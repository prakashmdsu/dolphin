
using Finance.Service.Settings;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;

namespace Finance.Service.Repository
{
    public static class Extensions
    {
        public static IServiceCollection AddMongo(this IServiceCollection services)
        {
            BsonSerializer.RegisterSerializer(new GuidSerializer(BsonType.String));
            BsonSerializer.RegisterSerializer(new DateTimeOffsetSerializer(BsonType.String));

            services.AddSingleton(serviceProvider =>
            {
                var configuration = serviceProvider.GetService<IConfiguration>();
                var serviceSettings = configuration.GetSection(nameof(ServiceSettings)).Get<ServiceSettings>();
                var mongoDbSettings = configuration.GetSection(nameof(MongoDbSettings)).Get<MongoDbSettings>();
                var mongoClient = new MongoClient(mongoDbSettings.ConnectionString);
                return mongoClient.GetDatabase(serviceSettings.ServiceName);
            });

            return services;
        }

        // public static IServiceCollection AddMongoRepository<T>(this IServiceCollection services, string collectionName)
        // {
        //     services.AddSingleton<IRepository<T>>(serviceProvider =>
        //     {
        //         var database = serviceProvider.GetService<IMongoDatabase>();
        //         return new Repositories<T>(database, collectionName);
        //     });

        //     return services;
        // }


        // Add MongoRepository that dynamically fetches a collection by name
        public static IServiceCollection AddMongoRepository<T>(this IServiceCollection services)
        {
            services.AddSingleton<IExtendedRepository<T>>(serviceProvider =>
            {
                var database = serviceProvider.GetService<IMongoDatabase>();
                return new ExtendedRepository<T>(database); // Register the repository as a singleton
            });

            return services;
        }

    }
}