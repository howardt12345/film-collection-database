#!/bin/sh

# Define the directory where your Vue app is built
VUE_APP_DIR="/usr/share/nginx/html"

for i in $(env | grep VUE_APP_)
do
    key=$(echo $i | cut -d '=' -f 1)
    value=$(echo $i | cut -d '=' -f 2-)
    echo "Replacing $key with $value"
    
    # Escape special characters in the value
    escaped_value=$(printf '%s\n' "$value" | sed -e 's/[\/&]/\\&/g')
    
    # Replace in JS files (including .js, .ts, and .vue files)
    find $VUE_APP_DIR -type f \( -name '*.js' -o -name '*.ts' -o -name '*.vue' \) -exec sed -i "s|$key|$escaped_value|g" {} +
    
    # Replace in CSS files
    find $VUE_APP_DIR -type f -name '*.css' -exec sed -i "s|$key|$escaped_value|g" {} +
    
    # Replace in HTML files
    find $VUE_APP_DIR -type f -name '*.html' -exec sed -i "s|$key|$escaped_value|g" {} +
done

# Run the Nginx server
nginx -g 'daemon off;'
