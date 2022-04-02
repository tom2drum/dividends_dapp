import React from 'react';

const genericMemo: <T>(component: T) => T = React.memo;

export default genericMemo;
