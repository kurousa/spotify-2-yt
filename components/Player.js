import {
    HeartIcon,
    VolumeUpIcon as VolumeDownIcon,
} from "@heroicons/react/outline";
import { 
    FastForwardIcon,
    PauseIcon,
    PlayIcon,
    ReplyIcon,
    RewindIcon,
    VolumeUpIcon, 
    SwitchHorizontalIcon
} from "@heroicons/react/solid";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { currentTrackIdState, isPlayingState } from "../atoms/songAtom";
import useSongInfo from "../hooks/useSongInfo";
import useSpotify from "../hooks/useSpotify"

function Player() {
    const spotifyApi = useSpotify();
    const { data: session } = useSession();
    const [ currentTrackId, setCurrentIdTrack ] = useRecoilState(currentTrackIdState);
    const [ isPlaying, setIsPlaying ] = useRecoilState(isPlayingState);
    const [ volume, setVolume ] = useState(50);
    const [ isRepeat, setIsRepeat ] = useState(false);
    const [ isShuffle, setIsShuffle ] = useState(false);
    const songInfo = useSongInfo();

    // fetching CurrentSongInfo
    const fetchCurrentSong = () => {
        if(!songInfo) {
            spotifyApi.getMyCurrentPlayingTrack()
            .then((data) => {
                console.log("Now Playing: ", data.body?.item);
                setCurrentIdTrack(data.body?.item.id);

                // Change isPlaying state.
                spotifyApi.getMyCurrentPlaybackState()
                .then((data) => {
                    setIsPlaying(data.body?.is_playing);
                });
            });
        }
    };

    // handling PlayBackState
    const handlePlayPause = () => {
        spotifyApi.getMyCurrentPlaybackState()
        .then((data) => {
            if(data.body.is_playing){
                spotifyApi.pause();
                setIsPlaying(false);
            } else {
                spotifyApi.play();
                setIsPlaying(true);
            }
        })
    }
    const handlePlayNext = () => {
        spotifyApi.skipToNext()
        .then((data) => {
            console.log(data);
            spotifyApi.getMyCurrentPlayingTrack()
            .then((data) => {
                console.log("Now Playing: ", data.body?.item);
                setCurrentIdTrack(data.body?.item.id);
            })
        })
    }
    const handlePlayPrev = () => {
        spotifyApi.skipToPrevious()
        .then((data) => {
            console.log(data);
            spotifyApi.getMyCurrentPlayingTrack()
            .then((data) => {
                console.log("Now Playing: ", data.body?.item);
                setCurrentIdTrack(data.body?.item.id);
            })
        })
    }
    const handleRepeat = () => {
        spotifyApi.setRepeat('track')
        .then(() => {
            console.log('Change Repeat track.');
            if(!isRepeat){
                setIsRepeat(true);
            } else {
                setIsRepeat(false);
            }
        })
        .catch((err) => {
            //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
            console.log('Something went wrong!', err);
        });
    }
    const handleShuffle = () => {
        // Toggle Shuffle For User’s Playback
        spotifyApi.setShuffle(isShuffle)
        .then(() => {
            console.log('Shuffle is change.');
            const nextButtonState = !isShuffle
            console.log('nextButtonState >> ', nextButtonState)
            setIsShuffle(nextButtonState);
        })
        .catch((err) => {
            console.error('Something happen!', err)
        });
    }

    // if token is valid and hasn`t currrentTrackId state, fetch CurrentSong.
    useEffect(() => {
        console.log("currentTrackid >>> ", currentTrackId)
        if(spotifyApi.getAccessToken() && !currentTrackId){
            //fetch song info
            fetchCurrentSong();
            setVolume(50);
        }
    }, [currentTrackIdState, spotifyApi, session])

    useEffect(() => {
        if (volume > 0 && volume < 100) {
            debouncedAdjustvolume(volume);
        }
    }, [volume])

    const debouncedAdjustvolume = useCallback(
        debounce((volume) => {
            spotifyApi.setVolume(volume);
        }, 300), [] 
    )

    return (
        <div className="h-24 bg-gradient-to-b from-black to-gray-900 text-white grid grid-cols-3 text-xs md:text-base px-2 md:px-8">

            {/* Left */}
            <div className="flex items-center space-x-4">
                <img 
                  className="hidden md:inline h-10 w-10"
                  src={songInfo?.album.images?.[0]?.url} 
                  alt="" />
                <div>
                    <h3>{songInfo?.name}</h3>
                    <p>{songInfo?.artists?.[0]?.name}</p>
                </div>
            </div>

            {/* Center */}
            <div className="flex items-center justify-evenly">
                { /* TODO Change state when click button*/ }
                {isShuffle ? (
                   <SwitchHorizontalIcon onClick={handleShuffle} className="button fill-current text-green-600" />
                ) : (
                   <SwitchHorizontalIcon onClick={handleShuffle} className="button" />
                )}

                <RewindIcon onClick={handlePlayPrev} className="button" />
                
                {isPlaying ? (
                    <PauseIcon onClick={handlePlayPause} className="button w-10 h-10" />   
                ): (
                    <PlayIcon onClick={handlePlayPause} className="button w-10 h-10" />
                )}
                
                <FastForwardIcon onClick={handlePlayNext} className="button" />
                
                { /* TODO Change state when click button*/ }
                {isRepeat ? (
                    <ReplyIcon onClick={handleRepeat} className="button fill-current text-green-600" />
                ):(
                    <ReplyIcon onClick={handleRepeat} className="button" />
                )}
            </div>

            {/* Right */}
            <div className="flex items-center space-x3 md:space-x-4 justify-end pr-5">
                <VolumeDownIcon 
                    onClick={() => volume > 0 && setVolume(volume - 10)}
                    className="button" 
                />
                <input 
                    className="w-14 md:w-28"
                    type="range" 
                    value={volume} 
                    min={0} 
                    max={100} 
                    onChange={(e) => setVolume(Number(e.target.value))} 
                />
                <VolumeUpIcon 
                    onClick={() => volume < 100 && setVolume(volume + 10)}                
                    className="button" 
                />
            </div>
            
            
        </div>
    )
}

export default Player
