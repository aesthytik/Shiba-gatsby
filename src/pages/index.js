import React from 'react';
import MainPart from '../components/MainPart';
import AboutDetails from '../components/AboutDetails';
import WorkDetails from '../components/WorkDetails';
import WhatPeopleSay from '../components/WhatPeopleSay';
import ContactDetails from '../components/ContactDetails';

export default () => (
  <div>
    <MainPart />
    <AboutDetails />
    <WorkDetails />
    {/* <WhatPeopleSay /> */}
    <ContactDetails />
  </div>
);
