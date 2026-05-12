using System.Text.Json;

namespace iterimApi.Helpers;

public sealed class JsonPreserveCasePolicy : JsonNamingPolicy
{
    public override string ConvertName(string name) => name;
}
