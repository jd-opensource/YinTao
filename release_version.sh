#!/usr/bin/env bash
###
# cherry发布新版本
# @Author: yfliqiang
# @Date: 2022-03-22
# 
# 提前安装：brew install md5sha1sum
###

# 版本升级
current_version=$(grep version package.json|cut -d '"' -f 4)
echo "当前版本为：$current_version"

versions=(${current_version//./ })
versions[2]=$((${versions[2]}+1))
new_version="${versions[0]}.${versions[1]}.${versions[2]}"

echo "更新后版本为:$new_version"
sed -i "" 's/"version": .*/"version": "'${new_version}'",/' package.json

# 本地编译、打包
yarn dist-all

# 文件上传至OSS
cd dist

for _file in $(ls);do
    if [[ $_file == *.zip ]] || [[ $_file == *.dmg ]] || [[ $_file == *.yml ]] || [[ $_file == *.json ]] ||  [[ $_file == *.exe ]];then
        if [[ $_file == "builder-debug.yml" ]];then
            continue
        fi
        bash ../upload_oss.sh $_file
    fi
done

cd ..

<<<<<<< HEAD
# package.json上传至OSS，用于展示版本更新说明
bash upload_oss.sh package.json

# 提交package.json
git status
echo '准备提交版本变更文件...'
git commit -m "release version:$new_version"
git push origin master

=======
# 提交package.json
# git status
# echo '准备提交版本变更文件...'
# git commit -m 'release version:$new_version'
# git push origin master
>>>>>>> 85b4e57 (自动更新)
