# JSON Web Token Example

This application uses Node JS, Express, and MySql

![Imgur](http://i.imgur.com/QZXbMq1.png)
![Imgur](http://i.imgur.com/ScV1igE.png)

# Getting Starting

* Git clone https://github.com/tance77/JWT_Example.git
* cd to the newly cloned directory 
* yarn install (npm install, should work as well, but yarn is much cleaner)
* yarn add global mysql sequelize sequelize-cli
* sequelize db:migrate (if this fails, you may need to create the schema jwt_example then re-run this command)
* npm start
* From your browser navigate to localhost:3001 or 127.0.0.1:3001 (Port can be changed in /bin/www line 16)

After completing the above steps you should be able to play around with some of the features on the website. The information you get using the JSON Web Token is the user's information, not including their password.
