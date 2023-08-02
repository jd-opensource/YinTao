const imgs = [
    'E:\\work\\cherry-plus\\cherry-next-el\\screenshots\\2022-01-21_17-45-09\\test-1\\Chrome_97.0.4692.99_Windows_10\\1.png',
    'E:\\work\\cherry-plus\\cherry-next-el\\screenshots\\2022-01-21_17-45-09\\test-1\\Chrome_97.0.4692.99_Windows_10\\2.png'
  ]

const axios = require('axios')
const fs = require('fs')

reportImages(imgs,"http://localhost")


  function reportImages(files,url){
    if(!files || files.length == 0) return;
    for(let file of files){
       let data = fs.readFileSync(file)
       const buffer = Buffer.from(data)
       let base64Img = `data:image/png;base64,` + buffer.toString('base64')
       if(!url || url == '') return;
       const res = axios.post(
        url,
        {
          image:base64Img,
          name: nanoid(7) + '.png',
        },
        {timeout:5000}
      )
    }
}