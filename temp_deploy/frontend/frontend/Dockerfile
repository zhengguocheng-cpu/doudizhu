# 使用Nginx Alpine镜像
FROM nginx:alpine

# 复制静态文件到Nginx默认目录
COPY public /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# Nginx会自动启动
CMD ["nginx", "-g", "daemon off;"]
