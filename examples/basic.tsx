import React from 'react';

type Props = {
    name: string;
};

export function HelloWorld({name}: Props) {
    return <div>Hello, {name}</div>;
}
