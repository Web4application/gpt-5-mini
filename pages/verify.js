import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Verify() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      fetch(`/api/verify?token=${token}`)
        .then(res => res.text())
        .then(msg => alert(msg));
    }
  }, [token]);

  return <p>Verifying your email...</p>;
}
