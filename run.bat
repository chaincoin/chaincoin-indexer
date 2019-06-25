docker stop chaincoinIndex
docker rm chaincoinIndex
docker run -d -it --name chaincoinIndex  mcna/images:chaincoin-index-v0.1-ubuntu