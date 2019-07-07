docker build -t mcna/images:chaincoin-index-v0.2-staging-ubuntu -f DockerFile .
docker push mcna/images:chaincoin-index-v0.2-staging-ubuntu
set /p temp="Hit enter to continue"