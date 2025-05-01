'use client';

import { useState, useEffect, useRef } from 'react';
import { setCookie, getCookie } from 'cookies-next';
import QRGenerator from "./qr";
import AutoScroll from './autoscroll';

const gdrivelinkprefix = "https://lh3.googleusercontent.com/d/"
const bgheaderid = "1yjVW5RelHzyqyJcYyb9J7YPuEdM5X3GV"
const bgfooterid = "1qOO9edsViKehiWKpkHNYEYD7yHnzPDQ4"
const snsButtonSet = "1QfW0zFtwz5poV3X_nBq9zYdKwZHpKoWm"
const defaultpfp = "1cdv8snvIogtCHBKlq2W1K3dYkK7SZUX1"
const pfpFolder = "1iObk9qywKpgnCf4RyCBuA3EUaFCFOqbM"
const blankPhoto = "13a7YHqESADlYcU5fVwW6Uka4uEgUNu75"
const eject = "1WnRBfqTc2L3EbWyrgPoYqeoDo6I65AJ3"
const refreshing = "1SbonKV7sJmRVuHGSGveYDc1ShT5sNMuf"
const fastForward = "1527RNruvuXS4sDZ8xlPRmCyJF0gA012J"
const refreshIcon = "1m2bNzbiPgTaRFZnBnmPK10eVyKfu-e4b"

function GetHeader() {
  return (
    <img
      src={gdrivelinkprefix + bgheaderid}
      alt="test google drive image"
      width={1300} // High resolution for quality
      height={0} // Auto-calculate
      className="w-full h-auto"
      referrerPolicy="no-referrer"  // Bypass referrer checks
    />
  )
}

function GetFooter() {
  return (
    <img
      src={gdrivelinkprefix + bgfooterid}
      alt="test google drive image"
      width={1300} // High resolution for quality
      height={0} // Auto-calculate
      className="w-full h-auto"
      referrerPolicy="no-referrer"  // Bypass referrer checks
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
  const [pfpData, setPFPData] = useState<Data | { "files": [] }>({});
  const url = GetGdriveFolderLink(props.scrollFolderID);
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': props.apiKey,
  };
  useEffect(() => {
    props.picsLoadedSetter(false);
    const fetchData = async () => {
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

        // Begin pre-processing of data.
        // 1. reject any file above 30MB or any non-image files.
        data["files"] = data["files"].filter((d: any) => (!d["mimeType"].includes("image")) || (Number(d["size"]) / 1024 / 1024 > 30) ||
          // ensure no funky image aspect ratios.
          (d["imageMediaMetadata"] !== null &&
            d["imageMediaMetadata"]["height"] / d["imageMediaMetadata"]["width"] <= 21 / 8 &&
            d["imageMediaMetadata"]["width"] / d["imageMediaMetadata"]["height"] <= 21 / 8))
        // 2. randomize the data.
        data["files"] = shuffleArray(data["files"])
        // 3. populate file owner.
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
            data["files"][i]["sharer_pfp"] = getRandomInt(0, 100)
          } else {
            data["files"][i]["sharer"] = "???"
            data["files"][i]["sharer_pfp"] = 0
          }
        }))
        setData(data);
        if (data["files"].length > 5) {
          props.picsLoadedSetter(true);
        }
        console.log("refreshing data:", data);
      } catch (error) {
        if (error instanceof Error) {
          error.message = "failed to refresh: " + error.message
          setError(error);
        } else {
          setError(new Error('An unknown error occurred'));
        }
      }
    };
    fetchData();
  }, []);

  if ((!data && !error) || data === null) return (
    <div className="w-full flex justify-center h-[70%]"><div className="text-2xl color-black items-center justify-items-center text-align-center  min-h-screen mt-5 p-5 overflow-hidden font-vt323 w-[80%]">
      {/* Refreshing */}
      <span className="vt323-regular text-8xl">REFRESHING...</span>
      <img
        src={gdrivelinkprefix + refreshing}
        alt=""
        width={0} // High resolution for quality
        height={600} // Auto-calculate
        referrerPolicy="no-referrer"  // Bypass referrer checks
        // loading="lazy"
        className="w-auto h-[30%] rounded-lg mt-10"
      />
    </div></div>);
  if (error) return <div>Fail to load album, error: {error.message} </div>;

  type IndexSplitter = (numm: number) => Boolean;

  function DataMap({ props }: { props: IndexSplitter }) {
    if (data === null) {
      return <span></span>
    }
    return data["files"].map((file: any, i: number) => {
      if (props(i)) {
        return <span key={file["id"]}></span>
      }

      const pfpDataList: any = pfpData["files"]
      return (
        <ImageFrame key={file["id"]} id={file["id"]} timestamp={file["createdTime"]}
          sharer={file["sharer"]} pfpData={pfpData}
          sharer_pfp={gdrivelinkprefix + pfpDataList[file["sharer_pfp"] % pfpData["files"].length]["id"]} />
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
  sharer_pfp: string;
  pfpData: Data;
}

function ImageFrame(props: ImageFrameProps) {
  const [loaded, setLoaded] = useState<Boolean | false>(false);

  return (
    <div className="relative m-2 p-2 bg-[#E4DDB6] rounded-md">

      <img key={props.id}
        src={gdrivelinkprefix + props.id}
        alt=""
        width={700} // High resolution for quality
        // quality={10}
        // loading="lazy"
        onLoad={() => setLoaded(true)}
        className="w-full h-auto rounded-lg"
        referrerPolicy="no-referrer"  // Bypass referrer checks
      // priority={false}
      // blurDataURL={gdrivelinkprefix + blankPhoto}
      // placeholder="blur"
      // onLoadingComplete={() => setLoaded(true)}
      />
      {/* {loaded ? <h5 className="text-shadow-black text-base absolute bottom-15 right-5 z-10 color-white overflow-hidden whitespace-nowrap">{props.timestamp}</h5> : <div className="hidden"></div>} */}

      {
        <div className="flex items-center space-x-4 w-full mt-2">
          <div className="w-[10%] flex justify-start">
            <div className="w-full h-auto rounded-full object-cover bg-white p-1 border border-black border-2">
              <img // profile picture
                className="w-full h-auto rounded-full object-cover"
                src={props.sharer_pfp}
                alt=""
                // quality={30}
                width={50}
                height={50}
                referrerPolicy="no-referrer"  // Bypass referrer checks
              // placeholder="blur"
              // blurDataURL={gdrivelinkprefix + defaultpfp}
              />
            </div>
          </div>

          <h3 className="color-black text-md flex-grow overflow-x-hidden lower-case">
            {props.sharer.replaceAll(" ", "_")}
          </h3>
          {/* <div className="w-12 h-12 max-w-[200px] aspect-auto"></div> */}
          <div className="w-[20%] flex justify-end">
            <img // sns icons
              src={gdrivelinkprefix + snsButtonSet}
              width={135}
              height={27}
              className="w-full h-auto"
              alt=""
              referrerPolicy="no-referrer"  // Bypass referrer checks
            />
          </div>
        </div>
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
  setAlbumName: setStr
}

function LoginPage(props: loginProps) {
  const [FolderID, setFolderID] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [albumName, setAlbumName] = useState('');;
  const [error, setError] = useState('');
  const [msg, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

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
    const albumNameC = getCookie('gdrivealbumname');
    if (albumNameC) {
      setAlbumName(albumNameC.toString());
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        formRef.current?.requestSubmit(); // Programmatically submit form
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

    setCookie('gdrivealbumname', albumName, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      secure: true,
      sameSite: 'strict'
    });

    props.setFolderID(trueFolderID);
    props.setAlbumName(albumName);
    props.setAPIKey(apiKey);
  };


  return (
    <div className="winky-rough-regular">
      <div className="max-w-md w-full space-y-8 ">
        <div>
          <h2 className="vt323-regular mt-6 text-center text-4xl font-extrabold text-[#F7D803]">
            Enter Google-Drive Folder Details
          </h2>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} ref={formRef}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
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
            <div>
              <input
                id="Album-Name"
                name="AlbumName"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white-500 placeholder-[#DEDEDE]-500 text-white-900 rounded-t-md focus:outline-none focus:ring-pink-500 focus:border-pink-700 focus:z-10 1xl:text-2xl mt-3"
                placeholder="album name (40 char max)"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value.length <= 40 ? e.target.value : e.target.value.slice(0, 39))}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center p-1 border border-transparent text-2xl font-extrabold vt323-regular rounded-md text-black bg-[#F7D803] hover:bg-[#EAAAFF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              LET'S GO!
            </button>
          </div>
        </form>

        {
          msg ? <div className="max-w-md bg-[#dedede] p-2 rounded-md">
            <code className="text-red-500">
              {msg}
            </code>
          </div> : <span></span>
        }
      </div>
      <div className="max-w-md text-xs">
        <h3 className='text-lg text-[#EAAAFF] font-semibold mt-1' id="to-setup-a-suitable-google-drive-shared-folder-link-"><code>Google Drive Shared Folder Link</code></h3>
        <ol className='text-gray-400'>
          <li>- Select a suitable google drive folder. </li>
          <li>- Ensure that it is shared to anyone with link</li>
          <li>- Navigate to &quot;Shared or Managed Access&quot; &gt; &quot;Copy Link&quot;</li>
        </ol>
        <h3 className='text-lg text-[#EAAAFF] font-semibold mt-2' id="to-get-the-google-api-key-"><code>Google API Key</code></h3>
        <ol className='text-gray-400'>
          <li>- Create a new Project or select an existing one in Google Cloud Console: <a href="https://console.cloud.google.com/">https://console.cloud.google.com/</a> </li>
          <li>- Navigate to &quot;APIs &amp; Services&quot; &gt; &quot;Library&quot;</li>
          <li>- Search for &quot;Google Drive API&quot;</li>
          <li>- Click &quot;Enable&quot;</li>
          <li>- Go to &quot;APIs &amp; Services&quot; &gt; &quot;Credentials&quot;: <a href="https://console.cloud.google.com/apis/credentials">https://console.cloud.google.com/apis/credentials</a> </li>
          <li>- Create a new API Key to access google drive apis.</li>
        </ol>
      </div>
    </div>
  );
}

type voidFunc = () => void

interface DesktopIconInterface {
  src: string,
  onClick: voidFunc,
  text: string,
  flipIcon: boolean,
}

function DesktopIcon(props: DesktopIconInterface) {
  return (
    <div className="w-[33%] flex flex-col justify-center item-center cursor-pointer m-3 hover:bg-blue-900 active:bg-gray-500" onClick={() => props.onClick()}>
      <img
        className={props.flipIcon ? "w-full h-auto object-cover scale-x-[-1]" : "w-full h-auto object-cover"}
        src={props.src}
        alt=""
        width={150}
        height={150}
        referrerPolicy="no-referrer"  // Bypass referrer checks
      />
      <span className="bg-[#000000]/50 rounded-lg text-sm w-full text-center mt-1 vt323-regular">{props.text}</span>
    </div>
  )
}

export default function Home() {
  const [FolderID, setFolderID] = useState('');
  const [FolderName, setFolderName] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [apiKey, setAPIKey] = useState('');
  const [refresh, setRefresh] = useState<Boolean | false>(false);
  const [scroll, setScroll] = useState<boolean | false>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number | 2>(2);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        setScroll(e => !e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="items-center h-[95vh] justify-items-center min-h-screen pt-[2%] gap-12 sm:px-5 overflow-hidden">
      {apiKey == '' || FolderID == '' ?
        <LoginPage
          setAPIKey={(s) => setAPIKey(s)}
          setFolderID={s => setFolderID(s)}
          setFolderName={s => setFolderName(s)}
          setAlbumName={s => setAlbumName(s)} />
        :
        <div className="w-full flex justify-between">
          <div className="h-[90vh] w-[15vw] flex flex-col my-2">
            <div className="flex w-full">
              <DesktopIcon text='EJECT' flipIcon={false} src={gdrivelinkprefix + eject} onClick={() => { setAPIKey(""); setFolderID(""); setScroll(false); }} />
              <DesktopIcon text='RELOAD' flipIcon={false} src={gdrivelinkprefix + refreshIcon} onClick={() => { setRefresh(e => !e) }} />
            </div>
            <div className="flex w-full">
              <DesktopIcon text='SLOWER' flipIcon={true} src={gdrivelinkprefix + fastForward} onClick={() => { setScrollSpeed(s => s <= 0.5 ? 0.5 : s / 2); console.log("scroll speed reduce:", scrollSpeed) }} />
              <DesktopIcon text='FASTER' flipIcon={false} src={gdrivelinkprefix + fastForward} onClick={() => { setScrollSpeed(s => s >= 32 ? 32 : s * 2); console.log("scroll speed increase:", scrollSpeed) }} />
            </div>

            <div className="flex-grow"></div>
            <div className="w-full relative">
              <QRGenerator url={`https://drive.google.com/drive/folders/${FolderID}?usp=sharing`} name={FolderName} fgColor="#284a42" bgColor="#FFFFFF" />
            </div>
          </div>


          <div className="h-[92vh] w-[80vw] flex flex-col overflow-hidden cursor-pointer">
            <div className="relative p-[-1] w-full">
              <GetHeader />
              <div style={{ fontSize: '2.2vw' }}
                className="vt323-regular text-gray-700 absolute top-[3vw] left-[10.5vw] z-10">{albumName}</div>
            </div>
            <div className="flex-1 scrollbar-track-custom overflow-y-auto mx-0.5 px-0.55 bg-[#F4C8FF] scroll-smooth [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-white" ref={scrollContainerRef} key={refresh ? "refresh fail" : "refresh mech"}>
              <AutoScroll scroll={scroll} speed={scrollSpeed} resetFunc={() => setRefresh(e => !e)}>
                <GetPics
                  picsLoadedSetter={(b) => { setScroll(b); }}
                  apiKey={apiKey}
                  scrollFolderID={FolderID} />
              </AutoScroll>
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
