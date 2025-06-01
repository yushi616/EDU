// RoleRouter.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';

const RoleRouter = () => {
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState('/');
  const [account, setAccount] = useState('');

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!window.ethereum) {
        alert("请安装 MetaMask");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        setAccount(userAddress);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);

        const role = await contract.getUserRole(userAddress);
        const user = await contract.getUserInfo(userAddress);

        if (role.toString() === '0') {
          setRedirectPath('/admin');
        } else if (!user.isRegistered) {
          setRedirectPath('/register');
        } else {
          // 根据角色跳转
          switch (role.toString()) {
            case '1':
              setRedirectPath('/upload-grade');
              break;
            case '2':
              setRedirectPath('/view-grades');
              break;
            case '3':
              setRedirectPath('/grade-approval');
              break;
            default:
              setRedirectPath('/');
          }
        }
      } catch (err) {
        console.error("跳转逻辑错误:", err);
        setRedirectPath('/');
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, []);

  if (loading) return <p>⏳ 正在检查用户状态...</p>;

  return <Navigate to={redirectPath} replace />;
};

export default RoleRouter;
