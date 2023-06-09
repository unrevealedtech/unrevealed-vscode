import { gql, GraphQLClient } from 'graphql-request';
import * as vscode from 'vscode';
import { API_URL } from './constants';

const PRODUCT_QUERY = gql`
  query Product($productId: ID!) {
    product(productId: $productId) {
      id
      name
      organization {
        id
        name
        slug
      }
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
    organization: {
      id: string;
      name: string;
      slug: string;
    };
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

  const { product } = await graphqlClient.request<ProductQueryResult>(
    PRODUCT_QUERY,
    {
      productId,
    },
  );

  return product;
}

const FEATURE_QUERY = gql`
  query Product($featureId: ID!) {
    feature(featureId: $featureId) {
      id
      key
      name
      description
      featureStage {
        id
        name
        icon
        color
      }
    }
  }
`;

export type FeatureQueryResult = {
  feature: {
    id: string;
    key: string;
    name: string;
    description?: string;
    featureStage: {
      id: string;
      name: string;
      color: string;
      icon: string;
    };
  };
};

export async function fetchFeature(featureId: string, token: string) {
  const graphqlClient = new GraphQLClient(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const { feature } = await graphqlClient.request<FeatureQueryResult>(
      FEATURE_QUERY,
      {
        featureId,
      },
    );
    return feature;
  } catch (err) {
    console.debug(err);
    vscode.window.showErrorMessage(
      `Unrevealed: could not fetch feature ${featureId}`,
    );
    return null;
  }
}
