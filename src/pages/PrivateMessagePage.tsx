import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { uploadData } from 'aws-amplify/storage';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { FaSignOutAlt, FaPlus, FaUserSecret, FaBalanceScale, FaLock } from 'react-icons/fa'; 
import { IoSettingsSharp } from "react-icons/io5";
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';

const client = generateClient<Schema>();

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  return formatter.format(date);
}

const PrivateMessagePage = () => {
  useAuthenticator((context) => [context.user]);
  const [userNickname, setUserNickname] = useState('');
  const { groupID } = useParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [groupDetails, setGroupDetails] = useState<{
    groupId: string;
    groupname: string;
    adminId: string;
    chatstatus: 'Def' | 'Activated';
  }>();
  const [msgText, setMsgText] = useState('');
  const [msgFile, setMsgFile] = useState<File | null>(null);
  const [msgs, setMsgs] = useState<Schema['GroupMessage']['type'][]>([]);
  const [fetchedUserId, setFetchedUserId] = useState('');
  const [isUserInGroup, setIsUserInGroup] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingfr, setLoadingfr] = useState(false);
  const [fetchedUsers, setFetchedUsers] = useState<
    Array<{ userId: string; userNickname: string; userIndexId: string; role: string }>
  >([]);
  const [userIdToRoleMap, setUserIdToRoleMap] = useState<{ [userId: string]: string }>({});
  const [loadingNicknames, setLoadingNicknames] = useState(true);
  const [groupNotFound, setGroupNotFound] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPopup2Open, setIsPopup2Open] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
 
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [shake, setShake] = useState(false);
  
  const shakeAnimation = {
    animation: 'shake 0.5s',
  };

  const inputStyles = {
    border: '1px solid',
    borderColor: 'transparent',
  };

  const errorStyles = {
    borderColor: 'red',
  };

  const handlePaymentLinkClick = async () => {
    const currentUrl = window.location.href;
    const stripeUrl = `https://buy.stripe.com/test_5kA28o5TpeLY9peeUU`;

    try {
      
      const { tokens } = await fetchAuthSession();
      const userId = tokens?.idToken?.payload.sub;

      if (userId) {
        const userIndexResponse = await client.models.UserIndex.list({
          filter: { userId: { eq: userId } },
        });

        if (userIndexResponse.data.length > 0) {
          const userIndexEntry = userIndexResponse.data[0];

          await client.models.UserIndex.update({
            id: userIndexEntry.id,
            recentgroup: currentUrl,
          });

          const stripeUrl2 = `${stripeUrl}?client_reference_id=${encodeURIComponent(
            userId
          )}`;

          window.location.href = stripeUrl2;
        }
      }
    } catch (error) {
      console.error('Error updating UserIndex or redirecting to Stripe:', error);
    
    }
  };

  const handleManagementLinkClick = async () => {
    const currentUrl = window.location.href;
    const stripeUrl = `https://billing.stripe.com/p/login/test_dR65m24p8bh7c12cMM`;

    try {
      setLoadingfr(true);
      const { tokens } = await fetchAuthSession();

      const userId = tokens?.idToken?.payload.sub;
      if (userId) {
        const userIndexResponse = await client.models.UserIndex.list({
          filter: { userId: { eq: userId } },
        });

        if (userIndexResponse.data.length > 0) {
          const userIndexEntry = userIndexResponse.data[0];

          await client.models.UserIndex.update({
            id: userIndexEntry.id,
            recentgroup: currentUrl,
          });

          const userEmail = userIndexEntry.email;

          const stripeUrl2 = `${stripeUrl}?prefilled_email=${encodeURIComponent(
            userEmail
          )}`;

          window.location.href = stripeUrl2;
        }
      }
    } catch (error) {
      console.error('Error updating UserIndex or redirecting to Stripe:', error);
      setLoadingfr(false);
    }
  };

  const handleVipLambdaClick = async () => {
    try {
      setLoadingfr(true);
  
      const { tokens } = await fetchAuthSession();
      const userId = tokens?.idToken?.payload.sub;
  
      if (!userId) {
        throw new Error('User ID not found in session.');
      }
  
      const currentUrl = window.location.href;
      const groupIdMatch = currentUrl.match(/groups\/([^/]+)/);
      if (!groupIdMatch || groupIdMatch.length < 2) {
        throw new Error('Invalid recent group URL format.');
      }
  
      const groupId = groupIdMatch[1];
      console.log('Extracted groupId:', groupId);

      await client.models.Group.update({
        id: groupId,
        chatstatus: 'Activated',
      });
  
      console.log('Group chat status updated to Activated.');
  
      await client.models.GroupMessage.create({
        id: uuidv4(),
        groupId: groupId,
        content: 'Attorney Client Privilege Activated',
        userNickname: 'System',
        type: 'system',
      });
  
      console.log('System message added: Attorney Client Privilege Activated.');

      const lawyerUserId = '914b9510-f021-701b-0ffb-e1650f8377ef';
  

      const lawyerIndexResponse = await client.models.UserIndex.list({
        filter: { userId: { eq: lawyerUserId } },
      });
  
      if (lawyerIndexResponse.data.length === 0) {
        throw new Error('Lawyer user not found in UserIndex.');
      }
  
      const lawyerUser = lawyerIndexResponse.data[0];
      const lawyerNickname = lawyerUser.userNickname || 'Unknown Lawyer';
  
      await client.models.GroupUser.create({
        id: uuidv4(),
        groupId: groupId,
        userId: lawyerUserId,
        role: 'member',
        userNickname: lawyerNickname,
        email: lawyerUser.email || 'unknown@example.com',
      });
  
      console.log('Lawyer added successfully to group.');
  
      await client.models.GroupMessage.create({
        id: uuidv4(),
        groupId: groupId,
        content: `Hello, my name is Luke the Man. I am an attorney with Sullo and Sullo.
Remember to review our terms and conditions so that your chat can be fully protected.
If you have any questions for me, send me a direct message or reach me at (***-***-****).`,
        userNickname: lawyerNickname,
        type: 'text',
      });
  
      console.log('Lawyer introduction message added successfully.');
  
    } catch (error) {
      console.error('Error processing VIP Lambda Click:', error);
    } finally {
      window.location.reload();
      setLoadingfr(false);
    }
  };
  
  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const openPopup2 = () => setIsPopup2Open(true);
  const closePopup2 = () => setIsPopup2Open(false);

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emailInput.trim() !== '') {
      e.preventDefault();
      setMemberEmails([...memberEmails, emailInput.trim()]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setMemberEmails(memberEmails.filter((e) => e !== email));
  };

  const handleEmailAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!groupDetails?.groupId) {
      console.warn('Group ID missing.');
      return;
    }

    if (emailInput.trim() !== '') {
      setMemberEmails((prevEmails) => [...prevEmails, emailInput.trim()]);
      setEmailInput('');
    }
    const updatedMemberEmails = [...memberEmails, emailInput.trim()];

    for (const email of updatedMemberEmails) {
      if (!email) continue; 
      try {
        const userIndexResponse = await client.models.UserIndex.list({
          filter: { email: { eq: email } },
        });

        if (userIndexResponse.data.length > 0) {
          const user = userIndexResponse.data[0];
          const existingGroupUserResponse = await client.models.GroupUser.list({
            filter: {
              groupId: { eq: groupDetails.groupId },
              userId: { eq: user.userId },
            },
          });

          if (existingGroupUserResponse.data.length === 0) {
            await client.models.GroupUser.create({
              groupId: groupDetails.groupId,
              userId: user.userId,
              email: user.email,
              role: 'member',
              userNickname: user.userNickname,
            });

            await client.models.GroupMessage.create({
              groupId: groupDetails.groupId,
              type: 'system',
              content: `${user.userNickname} has been added to the group`,
              userNickname: user.userNickname ?? 'Unknown User',
            });
          }
        } else {
          console.warn(`User with email ${email} not found in UserIndex.`);
        }
      } catch (error) {
        console.error(`Error adding user ${email} to group:`, error);
      }
    }

    navigate(`/groups/${groupDetails?.groupId}`);
    closePopup();
    window.location.reload();
  };

  const handleLeaveGroup = async (e: FormEvent) => {
    e.preventDefault();

    if (!groupDetails?.groupId || !fetchedUserId) return;

    try {
      const groupUserResponse = await client.models.GroupUser.list({
        filter: { groupId: { eq: groupDetails.groupId }, userId: { eq: fetchedUserId } },
      });

      if (groupUserResponse.data.length > 0) {
        const groupUser = groupUserResponse.data[0];

        await client.models.GroupUser.delete({ id: groupUser.id });

        await client.models.GroupMessage.create({
          groupId: groupDetails.groupId,
          type: 'system',
          content: `${userNickname} has left the group`,
          userNickname: userNickname,
        });

        navigate('/groups');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const subscribeToUserLeave = () => {
      if (groupDetails?.groupId) {
        const groupUserSub = client.models.GroupUser
          .onDelete({
            filter: {
              groupId: { eq: groupDetails.groupId },
            },
          })
          .subscribe({
            next: async (groupUser) => {
              if (groupUser && groupUser.userNickname) {
                setFetchedUsers((prevUsers) =>
                  prevUsers.filter(
                    (user) => user.userNickname !== groupUser.userNickname
                  )
                );
                const updatedUsersList = fetchedUsers.filter(
                  (user) => user.userNickname !== groupUser.userNickname
                );

                if (updatedUsersList.length === 0) {
                  window.location.reload();
                }
              }
            },
            error: (error) => console.error('Error:', error),
          });

        return () => groupUserSub.unsubscribe();
      }
    };

    const unsubscribe = subscribeToUserLeave();
    return unsubscribe;
  }, [groupDetails?.groupId, fetchedUsers]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const session = await fetchAuthSession();
        const currentUserId = session.tokens?.idToken?.payload.sub;

        if (currentUserId) {
          setFetchedUserId(currentUserId);
          const userIndexResponse = await client.models.UserIndex.list({
            filter: { userId: { eq: currentUserId } },
          });

          if (userIndexResponse.data.length > 0) {
            const latestNickname = userIndexResponse.data[0].userNickname || '';
            setUserNickname(latestNickname);
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchGroupUsers = async () => {
      if (groupDetails?.groupId && fetchedUserId) {
        try {
          setLoadingNicknames(true);

          const groupUserResponse = await client.models.GroupUser.list({
            filter: { groupId: { eq: groupDetails.groupId } },
          });

          const isUserInGroup = groupUserResponse.data.some(
            (groupUser) => groupUser.userId === fetchedUserId
          );

          setIsUserInGroup(isUserInGroup);

          const usersList: Array<{
            userId: string;
            userNickname: string;
            userIndexId: string;
            role: string;
          }> = [];
          const userIdToIndexId: { [userId: string]: string } = {};
          const userIdToRole: { [userId: string]: string } = {};

          for (const groupUser of groupUserResponse.data) {
            if (groupUser.userNickname) {
              const userIndexResponse = await client.models.UserIndex.list({
                filter: { userId: { eq: groupUser.userId } },
              });

              if (userIndexResponse.data.length > 0) {
                const userIndex = userIndexResponse.data[0];
                usersList.push({
                  userId: groupUser.userId,
                  userNickname: groupUser.userNickname,
                  userIndexId: userIndex.id,
                  role: userIndex.RedPill || '',
                });

                userIdToIndexId[groupUser.userId] = userIndex.id;
                userIdToRole[groupUser.userId] = userIndex.RedPill || '';
              } else {
                usersList.push({
                  userId: groupUser.userId,
                  userNickname: groupUser.userNickname,
                  userIndexId: '',
                  role: '',
                });

                userIdToIndexId[groupUser.userId] = '';
                userIdToRole[groupUser.userId] = '';
              }
            }
          }

          setFetchedUsers(usersList);
          setUserIdToRoleMap(userIdToRole);

          setLoading(false);
        } catch (error) {
          console.error('Error:', error);
          setLoading(false);
        } finally {
          setLoadingNicknames(false);
        }
      }
    };

    if (groupDetails?.groupId) {
      fetchGroupUsers();
    }
  }, [groupDetails, fetchedUserId]);

  useEffect(() => {
    if (!groupID) return;
    client.models.Group.listGroupByGroupUrlName(
      { groupUrlName: groupID },
      {
        selectionSet: ['id', 'groupname', 'adminId', 'messages.*', 'chatstatus'],
      }
    ).then(({ data }) => {
      if (data.length === 0) {
        setGroupNotFound(true);
        setLoading(false);
        return;
      }

      data[0].messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMsgs(data[0].messages as Schema['GroupMessage']['type'][]);
      setGroupDetails({
        groupId: data[0].id,
        groupname: data[0].groupname,
        adminId: data[0].adminId,
        chatstatus: data[0].chatstatus ?? 'Def',
      });
    });
  }, [groupID]);

  useEffect(() => {
    const subscribeToGroupMessages = () => {
      if (groupDetails?.groupId) {
        const sub = client.models.GroupMessage
          .onCreate({
            filter: {
              groupId: { eq: groupDetails.groupId },
            },
          })
          .subscribe({
            next: (data) => {
              setMsgs((prev) => [...prev, { ...data }]);
            },
            error: (error) => console.warn(error),
          });

        return () => sub.unsubscribe();
      }
    };

    const unsubscribe = subscribeToGroupMessages();
    return unsubscribe;
  }, [groupDetails?.groupId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (msgText.length > 500) {
      setIsOverLimit(true);
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setIsOverLimit(false);
      }, 500);
      return;
    }
    setIsOverLimit(false);

    if (!groupDetails?.groupId) {
      console.warn('Group ID missing. Cant send.');
      return;
    }

    let latestUserNickname = userNickname;
    try {
      const userIndexResponse = await client.models.UserIndex.list({
        filter: { userId: { eq: fetchedUserId } },
      });

      if (userIndexResponse.data.length > 0) {
        latestUserNickname = userIndexResponse.data[0].userNickname || '';
        setUserNickname(latestUserNickname);
      }
    } catch (error) {
      console.error('Error fetching latest userNickname:', error);
    }

    if (msgText) {
      await client.models.GroupMessage.create({
        groupId: groupDetails.groupId,
        type: 'text',
        content: msgText,
        userNickname: latestUserNickname,
      });

      setMsgText('');
    }

    if (msgFile) {
      const uploadedItem = await uploadData({
        data: msgFile,
        path: `chat-pics/${msgFile.name}`,
      }).result;

      await client.models.GroupMessage.create({
        groupId: groupDetails?.groupId as string,
        type: 'image',
        picId: uploadedItem.path,
        userNickname: latestUserNickname,
      });

      setMsgFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl">Checking Authorization...</h1>
      </div>
    );
  }
  if (loadingfr) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl">Loading...</h1>
      </div>
    );
  }

  if (groupNotFound) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold text-red-600">Group Does Not Exist</h1>
            <p>
              The group you are trying to access does not exist or may have been deleted.
            </p>
            <Link to="/" className="btn btn-primary mt-4">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isUserInGroup) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold text-red-600">Not Authorized</h1>
            <Link to="/" className="btn btn-primary">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderChatName = () => {
    if (!groupDetails?.groupname || !groupDetails?.groupId) return null;

    return (
      <Link
        to={`/groupdetails/${groupDetails.groupId}`}
        className="text-2xl font-bold hover:text-red-600 transition-colors"
      >
        {groupDetails.groupname}
      </Link>
    );
  };

  const currentUserRole = fetchedUserId ? userIdToRoleMap[fetchedUserId] : '';

  return (
    <div
      className={`flex flex-col min-h-screen ${
        groupDetails?.chatstatus === 'Activated' ? 'bg-black' : 'bg-white'
      }`}
    >
      <div className="bg-gray-100 flex justify-between items-center p-4 shadow-md">
        {loadingNicknames ? (
          <span className="user-nicknames text-primary-content"></span>
        ) : (
          <span className="user-nicknames text-primary-content">
            {fetchedUsers.map((user, index) => (
              <React.Fragment key={user.userId}>
                <Link to={`/profile/${user.userIndexId}`}>{user.userNickname}</Link>
                {index < fetchedUsers.length - 1 ? ', ' : ''}
              </React.Fragment>
            ))}
          </span>
        )}

        <div className="absolute left-1/2 transform -translate-x-1/2">
          {renderChatName()}
        </div>

        <div className="flex items-center space-x-2">
          {isUserInGroup && groupDetails?.adminId !== fetchedUserId && (
            <FaSignOutAlt className="text-red-600 text-xl" onClick={openPopup2} />
          )}

          <FaPlus className="text-red-600 text-xl" onClick={openPopup} />

          {/* Show FaUserSecret if NOT VIP and chat is not activated */}
          {currentUserRole !== 'VIP' && groupDetails?.chatstatus !== 'Activated' && (
            <a onClick={handlePaymentLinkClick} className="text-yellow-600 text-xl">
              <FaUserSecret />
            </a>
          )}

          {/* Show IoSettingsSharp if VIP */}
          {currentUserRole === 'VIP' && (
            <a onClick={handleManagementLinkClick} className="text-black-600 text-xl">
              <IoSettingsSharp />
            </a>
          )}

          {/* Show FaLock (VIP lambda button) only if user is VIP and admin of the chat or Owner */}
          {(currentUserRole === 'Owner' || (currentUserRole === 'VIP' && groupDetails?.adminId === fetchedUserId)) 
          && groupDetails?.chatstatus !== 'Activated' && (
            <a onClick={handleVipLambdaClick} className="text-black-600 text-xl">
              <FaLock />
            </a>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{
          maxHeight: '120vh',
          overflowY: 'auto',
        }}
      >
        {isPopupOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-65 z-50">
            <div className="bg-white p-6 rounded-md shadow-md">
              <h2 className="text-xl mb-4">Add Members</h2>
              <form onSubmit={handleEmailAddSubmit}>
                <input
                  type="text"
                  value={emailInput}
                  onChange={handleEmailInputChange}
                  onKeyDown={handleEmailInputKeyDown}
                  className="border p-2 mb-4 w-full"
                  placeholder="Enter email and press Enter"
                />
                <div className="flex flex-wrap mt-2">
                  {memberEmails.map((email) => (
                    <div
                      key={email}
                      className="bg-gray-200 p-2 m-1 rounded flex items-center"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-600"
                        onClick={() => handleRemoveEmail(email)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Member/s
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isPopup2Open && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-65 z-50">
            <div className="bg-white p-6 rounded-md shadow-md">
              <h2 className="text-xl mb-4">
                Are you sure you want to leave the group?
              </h2>
              <form onSubmit={handleLeaveGroup}>
                <div className="flex justify-center space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={closePopup2}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Leave Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>
          {`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
      `}
        </style>
        {/* Chat messages */}
        {msgs.map((msg) => {
          const matchedUser = fetchedUsers.find(u => u.userNickname === msg.userNickname);
          const role = matchedUser?.role || '';
          const userIndexId = matchedUser?.userIndexId || '';

          return (
            <div
              key={msg.id}
              className={clsx(
                'w-full flex',
                msg.type === 'system' ? 'justify-center' :
                msg.userNickname !== userNickname ? 'justify-start' : 'justify-end'
              )}
            >
              {msg.type === 'system' ? (
                <div className={`text-center w-full opacity-50 ${
                  groupDetails?.chatstatus === 'Activated' ? 'text-gray-300' : 'text-gray-333'
                }`}>
                  <p className="text-sm italic">{msg.content}</p>
                  <time className="text-sm italic opacity-50">
                    {formatTime(msg.createdAt)}
                  </time>
                </div>
              ) : (
                <>
                  {(msg.content || msg.picId) && (
                    <div
                      className={clsx(
                        'chat max-w-xl w-1/3',
                        msg.userNickname !== userNickname ? 'chat-start' : 'chat-end'
                      )}
                    >
                      <div className="chat-header">
                        <span
                          className={
                            groupDetails?.chatstatus === 'Activated'
                              ? 'text-white'
                              : 'text-black'
                          }
                        >
                          {role === 'Lawyer' && (
                            <FaBalanceScale className="inline-block text-yellow-500 mr-1" />
                          )}
                          {userIndexId ? (
                            <Link to={`/profile/${userIndexId}`}>
                              {msg.userNickname}
                            </Link>
                          ) : (
                            msg.userNickname
                          )}
                          <time className="text-xs opacity-50 text-black-200">
                            {' '}
                            {formatTime(msg.createdAt)}
                          </time>
                        </span>
                      </div>
                      {msg.content && (
                        <p
                          className={clsx(
                            'chat-bubble',
                            role === 'Lawyer'
                              ? ''
                              : msg.userNickname !== userNickname
                              ? 'chat-bubble-accent'
                              : 'chat-bubble-info',
                            groupDetails?.chatstatus === 'Activated'
                              ? 'text-white'
                              : 'text-black'
                          )}
                          style={
                            role === 'Lawyer'
                              ? { backgroundColor: '#FFFACD', color: 'black' }
                              : {}
                          }
                        >
                          {msg.content}
                        </p>
                      )}
                      {msg.picId && (
                        <StorageImage
                          path={msg.picId}
                          alt=""
                          className={clsx(
                            'chat-bubble',
                            role === 'Lawyer'
                              ? ''
                              : msg.userNickname !== userNickname
                              ? 'chat-bubble-accent'
                              : 'chat-bubble-info',
                            groupDetails?.chatstatus === 'Activated'
                              ? 'text-white'
                              : 'text-black'
                          )}
                          style={
                            role === 'Lawyer'
                              ? { backgroundColor: '#FFFACD', color: 'black' }
                              : {}
                          }
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="bg-info py-4 px-6 flex items-center">
        <input
          className={clsx('flex-1 input')}
          style={{
            ...inputStyles,
            ...(isOverLimit ? errorStyles : {}),
            ...(shake ? shakeAnimation : {}),
          }}
          placeholder="Type your message..."
          type="text"
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && setMsgFile(e.target.files[0])}
          className="file-input file-input-bordered file-input-primary w-full max-w-xs mx-4"
        />
        <button type="submit" className="btn btn-secondary">
          Send
        </button>
      </form>
    </div>
  );
};

export default PrivateMessagePage;
