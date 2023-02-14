/*
Copyright 2023 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/
import React, { useMemo } from 'react';
import { Link, useNavigate, useParams} from "react-router-dom";
import backIcon from '../images/icon-close.svg';
import Error from './Error';
import Loading from './Loading';
import { mapJsonRichText } from '../utils/renderRichText';
import './EventDetail.scss';
import useGraphQL from '../api/useGraphQL';

function EventDetail() {

    // params hook from React router
    const { slug } = useParams();
    const navigate = useNavigate();
    const eventSlug = slug.substring(1);

    const persistentQuery = `wknd-shared/event-by-slug`;

    // Use a custom React Hook to execute the GraphQL query
    const { data, errorMessage } = useGraphQL('', persistentQuery, {slug: eventSlug });

    // If there is an error with the GraphQL query
    if(errorMessage) return <Error errorMessage={errorMessage} />;

    // If query response is null then return a loading icon...
    if(!data) return <Loading />;

    // Set event properties variable based on graphQL response
    const currentEvent = getEvent(data);

    // Set references of current event
    const references = data.eventList._references;

    // Must have title, path, and image
    if( !currentEvent) {
      return <NoEventFound />;
    }

    return (<div className="event-detail">
        <button className="event-detail-close-button" onClick={() => navigate(-1)} >
            <img className="Backbutton-icon" src={backIcon} alt="Return" />
        </button>
        <EventDetailRender {...currentEvent} references={references}/>
    </div>);
}

function EventDetailSpeaker({name, title, profilePicture, keynote}) {
    const keynnoteSpeakerClass = keynote ? 'event-detail-keynote-speaker' : '';
    return (
        <li className={"event-detail-speaker " + keynnoteSpeakerClass}> 
            <div className="event-detail-speaker-card">
                <span className="event-detail-speaker-name">{name}</span>
                <span className="event-detail-speaker-title">{title}</span>
            </div>
            <img className="event-detail-speaker-img"
                    src={profilePicture._publishUrl} alt={name} itemType="image"/>
        </li>
    );
}

function EventDetailRender({
    _path,
    eventName,
    description,
    teasingImage,
    capacity,
    references,
    eventStart,
    eventEnd,
    speakers
}) {
    const editorProps = useMemo(() => true && { itemID: _path, itemType: "urn:fcs:type/fragment" }, [_path]);

    return (
        <div {...editorProps} itemScope>
            <h1 className="event-detail-title">{eventName}</h1>
            <div className="event-detail-content">
                <img className="event-detail-teasingImage"
                    src={teasingImage._publishUrl} alt={eventName} itemType="image"/>
                <div>
                <div className="event-detail-dates">
                    <span className="event-item-date" itemProp="eventStart" itemType="date">{eventStart}</span>
                    <span> to </span>
                    <span className="event-item-date" itemProp="eventEnd" itemType="date">{eventEnd}</span>
                </div>
                <div className="event-detail-description">{mapJsonRichText(description.json, customRenderOptions(references))}</div>
                </div>
                <div className="event-detail-speakers">
                    <h2>Featured Speakers</h2>
                    <ul className="event-detail-speakers-grid">
                        {
                            speakers.map((speaker) => {
                                return <EventDetailSpeaker {...speaker} />
                            })
                        }
                    </ul>
                </div>
            </div>
        </div>
    );
}

function NoEventFound() {
    return (
        <div className="event-detail">
            <Link className="event-detail-close-button" to={"/"}>
                <img className="Backbutton-icon" src={backIcon} alt="Return" />
            </Link>
            <Error errorMessage="Missing data, event could not be rendered." />
        </div>
    );
}

/**
 * Helper function to get the first event from the response
 * @param {*} response
 */
function getEvent(data) {

    if (data && data.eventList && data.eventList.items) {
        // expect there only to be a single event in the array
        if(data.eventList.items.length === 1) {
            return data.eventList.items[0];
        }
    }
    return undefined;
}

/**
 * Example of using a custom render for in-line references in a multi line field
 */
function customRenderOptions(references) {

    const renderReference = {
        // node contains merged properties of the in-line reference and _references object
        'ImageRef': (node) => {
            // when __typename === ImageRef
           return <img src={node._path} alt={'in-line reference'} />
        },
        'EventModel': (node) => {
            // when __typename === EventModel
            return <Link to={`/event:${node.slug}`}>{`${node.eventName}: ${node.capacity}`}</Link>;
        }
    };

    return {
        nodeMap: {
            'reference': (node, children) => {

                // variable for reference in _references object
                let reference;

                // asset reference
                if(node.data.path) {
                    // find reference based on path
                    reference = references.find( ref => ref._path === node.data.path);
                }
                // Fragment Reference
                if(node.data.href) {
                    // find in-line reference within _references array based on href and _path properties
                    reference = references.find( ref => ref._path === node.data.href);
                }

                // if reference found return render method of it
                return reference ? renderReference[reference.__typename]({...reference, ...node}) : null;
            }
        },
    };
}

export default EventDetail;
