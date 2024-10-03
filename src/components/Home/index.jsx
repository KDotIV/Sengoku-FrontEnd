import { useEffect, useState } from 'react';
import { getEvents } from '../../api';

function Home() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    getEvents();
  });

  return <div>Home Component</div>;
}

export default Home;
