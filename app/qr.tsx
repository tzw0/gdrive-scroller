'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface qrcodeProps {
    url: string
    fgColor: string
    bgColor: string
    name: string
}

export default function QRGenerator(props: qrcodeProps) {
    return (
        <div className="flex flex-col items-center gap-4 p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold">{props.name}</h1>

            <div className="bg-white rounded-lg shadow">
                <QRCodeSVG
                    value={props.url}
                    size={200}
                    fgColor={props.fgColor}
                    bgColor={props.bgColor}
                    className='rounded-lg'
                    level="H" // Error correction level
                    includeMargin={true}
                    marginSize={2}
                />
            </div>

            <div className="text-sm text-white-600">
                Share Your Memories here!
            </div>
        </div>
    );
}