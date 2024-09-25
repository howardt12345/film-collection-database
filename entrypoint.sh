#!/bin/sh

# Get all environment variables starting with VITE_
VITE_VARS=$(env | grep '^VITE_' | cut -d= -f1)

# Loop through each VITE_ variable and replace it in the files
for VAR in $VITE_VARS
do
  # Get the value of the variable
  VALUE=$(eval echo \$$VAR)
  
  # Replace the placeholder in all files under /usr/share/nginx/html
  find /usr/share/nginx/html -type f -exec sed -i "s|\${$VAR}|$VALUE|g" {} +
done

# Start nginx
exec "$@"