yarn install

echo "Starting local chain.."
pm2 start yarn --name pnt-chain -- chain
echo "Waiting..10secs"
sleep 10

echo "Deploying contract ..."
yarn deploy
echo "Waiting..10secs"
sleep 10

echo "Compiling and starting react app"
pm2 start yarn --name pnt-react -- start