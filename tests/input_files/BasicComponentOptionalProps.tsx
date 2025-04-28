import React from 'react';

type Props = {
    title?: string;
};

export const Card = ({title}: Props) => {
    return <div>{title}</div>;
};
