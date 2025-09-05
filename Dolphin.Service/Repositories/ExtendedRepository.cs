using MongoDB.Driver;

public class ExtendedRepository<T> : IExtendedRepository<T>
{
    private readonly IMongoDatabase _database;

    public ExtendedRepository(IMongoDatabase database)
    {
        _database = database;
    }

    public IMongoCollection<T> GetCollection(string collectionName)
    {
        return _database.GetCollection<T>(collectionName);
    }


}
