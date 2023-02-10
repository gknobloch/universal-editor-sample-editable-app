/*
Copyright 2023 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/
import React, { useMemo } from 'react';
import {Link} from 'react-router-dom';
import useGraphQL from '../api/useGraphQL';
import Error from './Error';
import Loading from './Loading';
import "./Events.scss";

function EventItem(props) {
  const editorProps = useMemo(() => true && { itemID: "urn:aemconnection:" + props?._path + "/jcr:content/data/master", itemType: "reference", itemfilter: "cf"}, [props._path]);

  // Must have eventName, path, and image
  if (!props || !props._path || !props.eventName || !props.teasingImage) {
    return null;
  }

  return (
    <li className="event-item" itemScope {...editorProps}>
      <Link to={`/event:${props.slug}`}>
        <img className="event-item-image" src={`${props.teasingImage._publishUrl}`}
                alt={props.title} itemProp="teasingImage" itemType="image" />
      </Link>
      <div className="event-item-details">
        <div className="event-item-date" itemProp="eventStart" itemType="date">{props.eventStart}</div>
        <div className="event-item-date" itemProp="eventEnd" itemType="date">{props.eventEnd}</div>
      </div>
      <div className="event-item-title" itemProp="eventName" itemType="text">{props.eventName}</div>
    </li>
  );
}

function Events() {
  const persistentQuery = 'wknd-shared/events-paginated';
  // Use a custom React Hook to execute the GraphQL query
  var queryParameters = {
    count: 2
  };
  const { data, errorMessage } = useGraphQL('', persistentQuery, queryParameters);

  // If there is an error with the GraphQL query
  if (errorMessage) return <Error errorMessage={errorMessage} />;

  // If data is null then return a loading state...
  if (!data) return <Loading />;

  console.log('data', data);

  return (
      <div className="events">
        <ul className="event-items">
          {
              // Iterate over the returned data items from the query
              data.eventPaginated.edges.map((event, index) => {
                return (
                  <EventItem key={index} {...event.node} />
                );
              })
          }
          </ul>
      </div>
  );
}

export default Events;
