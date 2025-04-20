'use client';

import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import { setCookie, getCookie } from 'cookies-next';
import QRGenerator from "./qr";

const gdrivelinkprefix = "https://drive.usercontent.google.com/download?id="
const gdriveFolderlinkprefix = "https://drive.usercontent.google.com/download?id="
const bgheaderid = "1z7-ICzTecSQ4Z4wbZsl8Rb38FCFSWrNy"
const bgfooterid = "1qOO9edsViKehiWKpkHNYEYD7yHnzPDQ4"
const snsButtonSet = "1QfW0zFtwz5poV3X_nBq9zYdKwZHpKoWm"
const defaultpfp = "1cdv8snvIogtCHBKlq2W1K3dYkK7SZUX1"
const pfpFolder = "1iObk9qywKpgnCf4RyCBuA3EUaFCFOqbM"
const blankPhoto = "13a7YHqESADlYcU5fVwW6Uka4uEgUNu75"
const eject = "1WnRBfqTc2L3EbWyrgPoYqeoDo6I65AJ3"
const refreshing = "1SbonKV7sJmRVuHGSGveYDc1ShT5sNMuf"

function GetHeader() {
  return (
    <Image
      src={gdrivelinkprefix + bgheaderid}
      alt="test google drive image"
      width={1300} // High resolution for quality
      height={0} // Auto-calculate
      className="w-full h-auto"
    />
  )
}

function GetFooter() {
  return (
    <Image
      src={gdrivelinkprefix + bgfooterid}
      alt="test google drive image"
      width={1300} // High resolution for quality
      height={0} // Auto-calculate
      className="w-full h-auto"
    />
  )
}

interface Data {
  // Define the shape of your data here
  [key: string]: any;
}

type boolSetter = (b: boolean) => void;


interface GetPicsProps {
  picsLoadedSetter: boolSetter;
  apiKey: string;
  scrollFolderID: string;
}

function GetGdriveFolderLink(id: string) {
  return 'https://www.googleapis.com/drive/v3/files/?q="' + id + '"+in+parents&fields=files(id,name,mimeType,createdTime,size,imageMediaMetadata,videoMediaMetadata)'
}

const GetGdriveObjInfo = (id: string) => "https://www.googleapis.com/drive/v3/files/" + id + "?fields=name,id,mimeType,owners(emailAddress,displayName)"

function GetPics(props: GetPicsProps) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pfpData, setPFPData] = useState<Data | {}>({});
  const url = GetGdriveFolderLink(props.scrollFolderID);
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': props.apiKey,
  };
  useEffect(() => {
    const fetchData = async () => {
      props.picsLoadedSetter(false);
      try {
        const pfp_response = await fetch(GetGdriveFolderLink(pfpFolder), {
          method: 'GET',
          headers: headers
        });
        if (!pfp_response.ok) {
          throw new Error(`HTTP error! status: ${pfp_response.status}`);
        }
        const pfp_data: Data = await pfp_response.json();
        setPFPData(pfp_data)


        const response = await fetch(url, {
          method: 'GET',
          headers: headers
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        var data: Data = await response.json();
        data["files"] = shuffleArray(data["files"])
        await Promise.all(data["files"].map(async (file: any, i: number) => {
          const response = await fetch(GetGdriveObjInfo(file["id"]), {
            method: 'GET',
            headers: headers
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          var ownerData: Data = await response.json();
          if (ownerData["owners"].length > 0) {
            data["files"][i]["sharer"] = ownerData["owners"][0]["displayName"]
          } else {
            data["files"][i]["sharer"] = "???"
          }
        }))
        setData(data);
        if (data["files"].length > 3) {
          props.picsLoadedSetter(true);
        }
        console.log("refreshing data:", data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error);
        } else {
          setError(new Error('An unknown error occurred'));
        }
      }
    };
    fetchData();
  }, []);

  if ((!data && !error) || data === null) return <div className="w-full flex justify-center"><div className="text-2xl color-black items-center justify-items-center text-align-center  min-h-screen mt-5 p-5 overflow-hidden font-vt323 w-[80%]">
    {/* Refreshing */}

    <span className="font-extrabold mb-3">REFRESHING</span>
    {/* <Image
      src={gdrivelinkprefix + refreshing}
      alt=""
      width={550} // High resolution for quality
      height={0} // Auto-calculate
      quality={20}
      loading="lazy"
      className="w-full h-auto rounded-lg"
      priority={false}
      blurDataURL={gdrivelinkprefix + blankPhoto}
      placeholder="blur"
    /> */}
  </div></div>;
  if (error) return <div>Error: {error.message}</div>;

  type IndexSplitter = (numm: number) => Boolean;
  function DataMap({ props }: { props: IndexSplitter }) {
    if (data === null) {
      return <span></span>
    }
    return data["files"].map((file: any, i: number) => {
      if (
        (!file["mimeType"].includes("image")) ||
        (Number(file["size"]) / 1024 / 1024 > 30) || // if greater than 20MB, skip it..
        props(i)
      ) {
        return <span key={file["id"]}></span>
      }
      return (
        <ImageFrame key={file["id"]} id={file["id"]} timestamp={file["createdTime"]}
          sharer={file["sharer"]} pfpData={pfpData} />
      )
    })
  }

  return (
    <div className="bg-[#F4AAFF] p-[2%]">
      <div className="flex flex-row gap-4 ">
        <div className="w-1/2 min-w-[200px] aspect-auto">
          <DataMap props={(ix: number) => ix % 2 === 0} />
        </div>
        <div className="w-1/2 min-w-[200px] aspect-auto">
          <DataMap props={(ix: number) => ix % 2 === 1} />
        </div>
      </div>
    </div>
  )
}

interface ImageFrameProps {
  id: string;
  timestamp: string;
  sharer: string;
  pfpData: Data;
}

function ImageFrame(props: ImageFrameProps) {
  const [loaded, setLoaded] = useState<Boolean | false>(false);

  function getPFP(): string {
    if ("files" in props.pfpData) {
      const pfpList = props.pfpData["files"]
      const indexSelected = getRandomInt(0, pfpList.length - 1)
      return gdriveFolderlinkprefix + pfpList[indexSelected]["id"];
    }
    return gdrivelinkprefix + defaultpfp;
  }

  return (
    <div className="relative m-2 p-2 bg-[#E4DDB6] rounded-md">

      <Image key={props.id}
        src={gdrivelinkprefix + props.id}
        alt=""
        width={550} // High resolution for quality
        height={0} // Auto-calculate
        quality={10}
        loading="lazy"
        className="w-full h-auto rounded-lg"
        priority={false}
        blurDataURL={gdrivelinkprefix + blankPhoto}
        placeholder="blur"
        onLoadingComplete={() => setLoaded(true)}
      />
      {/* {loaded ? <h5 className="text-shadow-black text-base absolute bottom-15 right-5 z-10 color-white overflow-hidden whitespace-nowrap">{props.timestamp}</h5> : <div className="hidden"></div>} */}


      {
        loaded ? <div className="flex items-center space-x-4 w-full mt-2">
          <div className="w-[10%] flex justify-start">
            <div className="w-full h-auto rounded-full object-cover bg-white p-1 border border-black border-2">
              <Image // profile picture
                className="w-full h-auto rounded-full object-cover"
                src={getPFP()}
                alt=""
                quality={30}
                width={50}
                height={50}
                placeholder="blur"
                blurDataURL={gdriveFolderlinkprefix + defaultpfp}
              />
            </div>
          </div>

          <h3 className="color-black text-md flex-grow overflow-x-hidden kaushan-script-regular lower-case">
            {props.sharer.replaceAll(" ", "_")}
          </h3>
          <div className="w-12 h-12 max-w-[200px] aspect-auto"></div>
          <div className="w-[20%] flex justify-end">
            <Image // sns icons
              src={gdrivelinkprefix + snsButtonSet}
              width={135}
              height={27}
              className="w-full h-auto"
              alt=""
            />
          </div>
        </div> : <span className="color-black">blah blah blah..</span>
      }
    </div>
  )
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type setStr = (s: string) => void

interface loginProps {
  setFolderID: setStr
  setAPIKey: setStr
  setFolderName: setStr
}

function LoginPage(props: loginProps) {
  const [FolderID, setFolderID] = useState('');;
  const [apiKey, setApiKey] = useState('');;
  const [error, setError] = useState('');
  const [msg, setMessage] = useState('');

  useEffect(() => {
    // Client-side cookie access
    const folderID = getCookie('gdrivefolderlink');
    if (folderID) {
      setFolderID(folderID.toString());
    }
    const apiKeyC = getCookie('gdriveapikey');
    if (apiKeyC) {
      setApiKey(apiKeyC.toString());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trueFolderID = FolderID.replace(new RegExp(`^${"https://drive.google.com/drive/folders/"}`), '').replaceAll("?usp=sharing", "");

    setError('');

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    };

    const response = await fetch(GetGdriveObjInfo(trueFolderID), {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) {
      setMessage(`failed to get gdrive folder: ${response.status}\n\n` + JSON.stringify(response.json()))
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.status != 200) {
      setMessage("failed to validate gdrive folder: " + JSON.stringify(response.json()))
      return
    }

    const resp = await response.json()
    if (resp["mimeType"].toString() !== "application/vnd.google-apps.folder") {
      setMessage("Google Drive ID is not a valid folder: gdrive object does not have mimeType:'application/vnd.google-apps.folder'")
      return
    }

    props.setFolderName(resp["name"])

    setCookie('gdrivefolderlink', trueFolderID, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      secure: true,
      sameSite: 'strict'
    });

    setCookie('gdriveapikey', apiKey, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      secure: true,
      sameSite: 'strict'
    });

    props.setFolderID(trueFolderID);
    props.setAPIKey(apiKey);
  };


  return (
    <div className="font-ibm">
      <div className="max-w-md w-full space-y-8 ">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Enter Google-Drive Folder Details
          </h2>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="FolderID-address" className="sr-only">
                G-Drive Shared Folder Link
              </label>
              <input
                id="FolderID-address"
                name="FolderID"
                type="FolderID"
                autoComplete="FolderID"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white-500 placeholder-[#DEDEDE]-500 text-white-900 rounded-t-md focus:outline-none focus:ring-pink-500 focus:border-pink-700 focus:z-10 1xl:text-2xl"
                placeholder="Google Drive Shared Folder Link"
                value={FolderID}
                onChange={(e) => setFolderID(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="apiKey" className="sr-only">
                Google API Key
              </label>
              <input
                id="apiKey"
                name="apiKey"
                type="password"
                autoComplete="current-apiKey"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 mt-3 border border-white-500 placeholder-[#DEDEDE]-500 text-white-900 rounded-b-md focus:outline-none focus:ring-pink-500 focus:border-pink-700 focus:z-10 1xl:text-2xl"
                placeholder="Google API Key"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value) }}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-[#CAF1FF] hover:bg-white-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Let's Go!
            </button>
          </div>
        </form>

        {
          msg ? <div className="w-full bg-[#dedede] p-2 rounded-md">
            <code className="text-red-500">
              {msg}
            </code>
          </div> : <span></span>
        }
      </div>
    </div>
  );
}

export default function Home() {
  const [FolderID, setFolderID] = useState('');
  const [FolderName, setFolderName] = useState('');
  const [apiKey, setAPIKey] = useState('');
  const [refresh, setRefresh] = useState<Boolean | false>(false);
  const [scroll, setScroll] = useState<boolean | false>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number | 2>(2);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!scroll || scrollContainerRef == null || !scrollContainerRef.current) return;

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += scrollSpeed;
      }

      // Check if reached bottom
      const reachedBottom = scrollContainerRef.current.scrollHeight -
        scrollContainerRef.current.scrollTop <
        scrollContainerRef.current.clientHeight + 1;
      if (reachedBottom) {
        scrollContainerRef.current.scrollTop = 0; // Reset to top
        setRefresh(e => !e)
      }

    }, 20);

    return () => clearInterval(timer);
  }, [scroll, scrollSpeed]);

  return (
    <div className="items-center justify-items-center min-h-screen pt-20 gap-12 sm:px-5 bg-[#498679] font-ibm">
      {apiKey == '' || FolderID == '' ?
        <LoginPage setAPIKey={(s) => setAPIKey(s)} setFolderID={s => setFolderID(s)} setFolderName={s => setFolderName(s)} />
        :
        <div className="w-full flex justify-between">
          <div className="h-[85vh] w-[20vw] flex flex-col my-2">
            <div className="flex w-full">
              <div className="w-[30%] flex flex-col justify-center item-center cursor-pointer m-3" onClick={() => { setAPIKey(""); setFolderID(""); }}>
                <Image // eject disk
                  className="w-70% h-auto object-cover"
                  src={gdriveFolderlinkprefix + eject}
                  alt=""
                  quality={80}
                  width={100}
                  height={100}
                  placeholder="blur"
                  blurDataURL={gdriveFolderlinkprefix + blankPhoto}
                />
                <span className="bg-[#000000]/50 rounded-lg px-2 py-1 text-xs w-full text-center mt-1">eject</span>
              </div>
            </div>

            <div className="flex-grow"></div>
            {/* remaining desktop icons */}
            <QRGenerator url={`https://drive.google.com/drive/folders/${FolderID}?usp=sharing`} name={FolderName} fgColor="#498679" bgColor="#FFFFFF" />
          </div>


          <div className="h-[85vh] w-[75vw] flex flex-col overflow-hidden cursor-pointer" onClick={() => setScroll(e => !e)}>
            <div className="relative p-[-1] w-full">
              <GetHeader />
            </div>
            <div className="flex-1 scrollbar-track-custom overflow-y-auto mx-0.5 px-0.55 bg-[#F4C8FF] scroll-smooth [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-white" ref={scrollContainerRef} key={refresh ? "terrible" : "refresh mech"}>
              <GetPics
                picsLoadedSetter={(b) => setTimeout(() => {
                  setScroll(b)
                }, 5000)}
                apiKey={apiKey}
                scrollFolderID={FolderID} />
            </div>
            <div className="p-[-1]">
              <GetFooter />
            </div>
          </div>
        </div>
      }

    </div>
  );
}
