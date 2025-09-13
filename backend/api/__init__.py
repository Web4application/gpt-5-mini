import redis

r = redis.Redis.from_url("redis://default:SNezMa2Q7GuhZP4bbAWN7oiUFjhPb2Xl@redis-16963.c82.us-east-1-2.ec2.redns.redis-cloud.com:16963")

success = r.set("foo", "bar")
# True

result = r.get("foo")
print(result)
# >>> bar

