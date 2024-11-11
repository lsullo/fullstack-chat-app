import { Link, useLocation } from 'react-router-dom';
import gifImage from '/chad.gif';

const PaymentSuccess = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('checkout_session_id');
  const clientReferenceId = queryParams.get('client_reference_id'); // Add this line

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="py-6">
            Thank you for your payment! You can now access your group chat rooms.
          </p>
          <img src={gifImage} alt="Success" className="mx-auto my-4" />
          <Link to="/groups" className="btn btn-primary" style={{ marginLeft: '10px' }}>
            Go to Group Chats
          </Link>
          {sessionId && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Session ID:</h2>
              <p>{sessionId}</p>
            </div>
          )}
          {clientReferenceId && ( // Display client reference ID
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Client Reference ID:</h2>
              <p>{clientReferenceId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
