using MongoDB.Driver;

public interface IExtendedRepository<T>
{
    IMongoCollection<T> GetCollection(string collectionName);
}
