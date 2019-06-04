FROM alterway/php:5.3-apache
RUN apache2
# RUN apt-get update
EXPOSE 80

RUN echo -e "\nmagic_quotes_gpc = Off\nextension=mysqli.so\n" >> /usr/local/etc/php/php.ini
COPY /joomla /var/www/html/
