'use client';
import { QRCodeSVG } from 'qrcode.react';

interface qrcodeProps {
    url: string
    fgColor: string
    bgColor: string
    name: string
}

export default function QRGenerator(props: qrcodeProps) {
    return (
        <div className="flex flex-col items-center gap-2 p-2 max-w-md mx-auto arimo-regular color-white">
            <h1 className="text-md font-bold">Upload Images here!</h1>

            <div className="bg-white rounded-lg shadow w-full">
                <QRCodeSVG
                    value={props.url}
                    style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}
                    fgColor={props.fgColor}
                    bgColor={props.bgColor}
                    className='rounded-lg w-full h-full'
                    level="H" // Error correction level
                    includeMargin={true}
                    marginSize={2}
                />
            </div>

            <div className="text-sm text-white-600">
                Download the 'google drive' app for best experience and allow uploads with mobile data if required!
            </div>
        </div>
    );
}