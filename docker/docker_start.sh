#! /bin/bash
# source /home/admin/tags
BASE_PATH=/export/servers/
FRONT_PATH=/export/servers/App
chromiumVersion="1001"

# start nginx
nginx

mkdir -p /export/App/cherry

# server

wget https://storage.jd.com/assert/linux-unpacked.zip  -O  /export/App/cherry/linux-unpacked.zip

cd /export/App/cherry && unzip -qo /export/App/cherry/linux-unpacked.zip -d /export/App/cherry

mkdir -p  "/root/.cache/ms-playwright/chromium-$chromiumVersion"

wget https://storage.jd.com/assert/chrome-linux.zip -O  "/root/.cache/ms-playwright/chromium-$chromiumVersion/chrome-linux.zip"

cd "/root/.cache/ms-playwright/chromium-$chromiumVersion" && unzip -qo "/root/.cache/ms-playwright/chromium-$chromiumVersion/chrome-linux.zip"

echo "run cherry"

# 使用虚拟显卡
# Xvfb -ac :7 -screen 0 1280x1024x24 &
# export  DISPLAY=:7

# 启动服务
cd /export/App/cherry  && nohup /export/App/cherry/cherry --no-sandbox httpPort=8088 &

echo "JDOS_DOCKER_SERVICE_STARTED"
sleep 9999999d
exit 0
