import axios from 'axios';

export const getEvents = async () => {
  const response = await axios.post(
    'https://sengoku-alexandria-qa.azurewebsites.net/api/events/QueryEventsByLocation',
    {
      regionId: 30033,
      perPage: 50,
      priority: 'date',
    }
  );
  console.log(response);
};
