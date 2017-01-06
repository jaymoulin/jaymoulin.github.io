# Install docker

If you didn't install Docker yet, you can do it with a simple command :

```
sudo curl -sSL https://get.docker.com | sh
```

(if you want to allow some of your users to use docker, you'll probably want to add requested usr to docker group with this optional step)

```
sudo usermod -aG docker ${USER}
```

# Install Docker-compose

Installation is maintained at [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/) but it will look like that:

```
sudo curl -L "https://github.com/docker/compose/releases/download/1.9.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```
