import React, { useState } from 'react';
//=== npm i react-ffmpeg
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

import './App.css';



async function processVideo({ intervals, chuckNum, ffmpeg, startTime, chuckSize, fileName, fileExt }) {
  const trimedName = 'trimmed.' + fileExt;
  // const fadedName = 'faded.' + fileExt;

  await ffmpeg.run(

      '-ss', intervals[chuckNum].from,
      '-to', intervals[chuckNum].to,


      // '-ss', `00:00:${(0===(startTime + (chuckNum  ) * chuckSize))?'00':startTime + (chuckNum  ) * chuckSize}`,
      // '-to', `00:00:${startTime + (chuckNum+1) * chuckSize}`,

      // '-ss', `00:00:0${startTime}`,
      // '-to', `00:00:0${startTime + chuckSize}`,
      '-i', fileName,
      // '-vf', 'fade=t=in:st=0:d=1',
      '-c', 'copy', trimedName
  );

  // await ffmpeg.run('-i', trimedName, '-vf', `fade=t=in:st=0:d=0.5,fade=t=out:st=${chuckSize - 0.5}:d=0.5`, '-c:a', 'copy', fadedName);
  // const data = ffmpeg.FS('readFile', fadedName);

  const data = ffmpeg.FS('readFile', trimedName) ;

  return URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

}

function App() {
  const [video, setVideo] = useState('');
  const [rawVideoSrc, setRawVideoSrc] = useState('');
  const [message, setMessage] = useState('Click Start to transcode');
  const [videoSrcChunks, setVideoSrcChunks] = useState([]);


  const ffmpeg = createFFmpeg({
    // log: true,
    log: false,
    corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
    mainName: "main",
    }
  );
  //
  // const ffmpeg = createFFmpeg({
  //   log: true,
  //   corePath: '/ffmpeg-core.js'
  // });

  const doTranscode = async () => {
    const fileName = video.name;
    const fileExt = fileName.split('.').pop();

    console.log('[x] videoName', fileName, video);
    setMessage('Loading ffmpeg-core.js');
    await ffmpeg.load();
    setMessage('Start transcoding');
    ffmpeg.FS('writeFile', fileName, await fetchFile(video));
    const chunks = [];
    // const intervals = [
    //   {from:'00:00:02',to:'00:19:08'},
    //   {from:'00:19:08',to:'00:30:36'}
    // ];
    const intervals = [
      {from:'00:00:02',to:'00:00:08'},
      {from:'00:00:09',to:'00:00:15'},
      {from:'00:00:16',to:'00:00:20'},
    ];

    const len = 2;
    let startTime = 0;
    for (let i = 0; i < len; i ++) {
      setMessage(`Progress: ${i + 1}/${len}`);
      chunks.push(await processVideo({
        intervals,
        chuckNum:i,
        fileName,
        fileExt,
        startTime,
        chuckSize: 10,
        ffmpeg,
      }));
      // startTime += 20;
    }
    setMessage('Complete transcoding !');
    setVideoSrcChunks(chunks);
  };

  return (
      <div className="App">
        <p/>
        { rawVideoSrc && <video width="400" src={rawVideoSrc} controls></video> }
        <br/>
        <input type="file" onChange={(e) => {
          const file = e.target.files?.item(0);
          setRawVideoSrc(URL.createObjectURL(file));
          setVideo(file);
        }} />
        <br/>
        { video && <button onClick={doTranscode}>Start</button> }
        <p>{message}</p>
        <br/>

        { videoSrcChunks.map((src, index) => <video download={"file_" + Date.now().toString()+'_'+index.toString()} key={index} width="250" src={src} controls></video>) }

        <br/>

        { videoSrcChunks.map((src, index) =>
            <a href={src} key={index} download={"file_USE_VLC_player!!!_" + Date.now().toString()+'_'+index.toString()} >
              <video width="250" src={src} controls></video>
              Download {index}
            </a>
          )
        }

      </div>
  );
}

export default App;