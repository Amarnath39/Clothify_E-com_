import axios from "axios";

export const axiosInstance = axios.create({});

export const apiConnector = (
  method: any,
  url: any,
  bodyData: any,
  headers: any,
  params: any
) => {
  return axiosInstance({
    method: `${method}`,
    url: `${url}`,
    data: bodyData ? bodyData : null,
    headers: headers ? headers : null,
    params: params ? params : null,
  });
};
