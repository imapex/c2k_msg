FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

# Set environment variable
CMD ["export", "SOME_TOKEN", "63et36ter28y6yy76yt"]

# Port that node server runs on within the container
EXPOSE 8080

CMD [ "npm", "start", "broker.js" ]

