import { gql, GraphQLClient } from 'graphql-request';
import * as vscode from 'vscode';

export const API_URL = 'https://api.unrevealed.tech/graphql';

const PRODUCT_QUERY = gql`
  query Product($productId: ID!) {
    product(productId: $productId) {
      id
      name
      features(status: ACTIVE) {
        id
        key
        name
      }
    }
  }
`;

export type ProductQueryResult = {
  product: {
    id: string;
    name: string;
    features: Array<{
      id: string;
      key: string;
      name: string;
    }>;
  };
};

export async function fetchProduct(productId: string, token: string) {
  const graphqlClient = new GraphQLClient(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const { product } = await graphqlClient.request<ProductQueryResult>(
      PRODUCT_QUERY,
      {
        productId,
      },
    );
    return product;
  } catch (err) {
    let message = 'Unrevealed: could not fetch product';
    vscode.window.showErrorMessage(message);
    return null;
  }
}
