import React from 'react';

type Props = {
    name: string;
    age: number;
};

export function HelloWorld({name, age}: Props) {
    return (
        <div>
            {name} - {age}
        </div>
    );
}
