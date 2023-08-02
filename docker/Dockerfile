FROM ubuntu:focal
RUN apt-get update && apt-get install -y openssl wget vim nginx curl

ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Los_Angeles
ADD docker_start.sh /home/admin/

RUN chmod +x /home/admin/docker_start.sh

# gnome-calculator 混合部分依赖
RUN apt-get -y install unzip libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 gnome-calculator xvfb dbus xdg-utils software-properties-common

# 中文字体
RUN apt-get  -y install fonts-wqy-microhei ttf-wqy-zenhei


ENTRYPOINT ["/home/admin/docker_start.sh"]